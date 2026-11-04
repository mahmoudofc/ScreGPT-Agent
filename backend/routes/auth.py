import hashlib
import hmac
import json
import os
import re
import secrets
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, cast
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

router = APIRouter()

# Tunable security parameters (kept in one place).
_PBKDF2_ITERATIONS = 260_000
_SALT_BYTES = 16
_SESSION_TTL_DAYS = 7

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

# Optional bearer scheme; auto_error=False so we can return a clean 401.
_bearer = HTTPBearer(auto_error=False)


class UserRecord(BaseModel):
    id: str
    email: str
    name: str
    salt: str
    passwordHash: str
    createdAt: str


class SessionRecord(BaseModel):
    token: str
    userId: str
    expiresAt: str


class PublicUser(BaseModel):
    id: str
    email: str
    name: str


class AuthResponse(BaseModel):
    token: str
    user: PublicUser


class MeResponse(BaseModel):
    user: PublicUser


class SignupRequest(BaseModel):
    email: str
    name: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


def get_auth_data_dir() -> Path:
    data_dir = os.environ.get("SCRENGPT_DATA_DIR") or os.environ.get(
        "SCREENSHOT_TO_CODE_DATA_DIR"
    )
    base_path = Path(data_dir).expanduser() if data_dir else Path.home() / ".screngpt"
    return base_path


def _users_file() -> Path:
    return get_auth_data_dir() / "users.json"


def _sessions_file() -> Path:
    return get_auth_data_dir() / "sessions.json"


def utc_timestamp() -> str:
    return datetime.now(timezone.utc).isoformat()


def _write_json_atomic(file_path: Path, payload: Any) -> None:
    file_path.parent.mkdir(parents=True, exist_ok=True)
    tmp_path = file_path.with_suffix(file_path.suffix + ".tmp")
    tmp_path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    tmp_path.replace(file_path)


def _read_json_list(file_path: Path) -> list[Any]:
    if not file_path.exists():
        return []
    try:
        raw = json.loads(file_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=500, detail="Auth storage is corrupt") from exc
    if not isinstance(raw, list):
        raise HTTPException(status_code=500, detail="Auth storage must contain a list")
    return cast(list[Any], raw)


def read_users() -> list[UserRecord]:
    users: list[UserRecord] = []
    for raw in _read_json_list(_users_file()):
        if not isinstance(raw, dict):
            continue
        try:
            users.append(UserRecord(**raw))
        except Exception:
            continue
    return users


def write_users(users: list[UserRecord]) -> None:
    _write_json_atomic(_users_file(), [user.model_dump() for user in users])


def read_sessions() -> list[SessionRecord]:
    sessions: list[SessionRecord] = []
    for raw in _read_json_list(_sessions_file()):
        if not isinstance(raw, dict):
            continue
        try:
            sessions.append(SessionRecord(**raw))
        except Exception:
            continue
    return sessions


def write_sessions(sessions: list[SessionRecord]) -> None:
    _write_json_atomic(_sessions_file(), [session.model_dump() for session in sessions])


def hash_password(password: str, salt_hex: str) -> str:
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        bytes.fromhex(salt_hex),
        _PBKDF2_ITERATIONS,
    )
    return digest.hex()


def verify_password(password: str, salt_hex: str, expected_hash: str) -> bool:
    candidate = hash_password(password, salt_hex)
    return hmac.compare_digest(candidate, expected_hash)


def normalize_email(email: str) -> str:
    normalized = email.strip().lower()
    if not _EMAIL_RE.match(normalized):
        raise HTTPException(status_code=400, detail="A valid email is required")
    return normalized


def validate_password(password: str) -> None:
    if len(password) < 8:
        raise HTTPException(
            status_code=400, detail="Password must be at least 8 characters"
        )


def create_session(user_id: str) -> SessionRecord:
    sessions = read_sessions()
    # Drop expired sessions opportunistically.
    now = datetime.now(timezone.utc)
    sessions = [
        session
        for session in sessions
        if datetime.fromisoformat(session.expiresAt) > now
    ]
    session = SessionRecord(
        token=secrets.token_urlsafe(32),
        userId=user_id,
        expiresAt=(now + timedelta(days=_SESSION_TTL_DAYS)).isoformat(),
    )
    sessions.append(session)
    write_sessions(sessions)
    return session


def _public_user(user: UserRecord) -> PublicUser:
    return PublicUser(id=user.id, email=user.email, name=user.name)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> UserRecord:
    if credentials is None or not credentials.credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")

    token = credentials.credentials
    now = datetime.now(timezone.utc)
    for session in read_sessions():
        if session.token != token:
            continue
        if datetime.fromisoformat(session.expiresAt) <= now:
            raise HTTPException(status_code=401, detail="Session expired")
        for user in read_users():
            if user.id == session.userId:
                return user
        raise HTTPException(status_code=401, detail="Not authenticated")

    raise HTTPException(status_code=401, detail="Not authenticated")


@router.post("/api/auth/signup", response_model=AuthResponse)
async def signup(request: SignupRequest) -> AuthResponse:
    email = normalize_email(request.email)
    validate_password(request.password)
    name = request.name.strip() or email.split("@")[0]

    users = read_users()
    if any(user.email == email for user in users):
        raise HTTPException(status_code=409, detail="An account already exists")

    salt_hex = secrets.token_hex(_SALT_BYTES)
    user = UserRecord(
        id=str(uuid4()),
        email=email,
        name=name,
        salt=salt_hex,
        passwordHash=hash_password(request.password, salt_hex),
        createdAt=utc_timestamp(),
    )
    users.append(user)
    write_users(users)

    session = create_session(user.id)
    return AuthResponse(token=session.token, user=_public_user(user))


@router.post("/api/auth/login", response_model=AuthResponse)
async def login(request: LoginRequest) -> AuthResponse:
    email = request.email.strip().lower()
    for user in read_users():
        if user.email != email:
            continue
        if not verify_password(request.password, user.salt, user.passwordHash):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        session = create_session(user.id)
        return AuthResponse(token=session.token, user=_public_user(user))

    raise HTTPException(status_code=401, detail="Invalid email or password")


@router.post("/api/auth/logout", status_code=204)
async def logout(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> Response:
    if credentials and credentials.credentials:
        token = credentials.credentials
        remaining = [session for session in read_sessions() if session.token != token]
        write_sessions(remaining)
    return Response(status_code=204)


@router.get("/api/auth/me", response_model=MeResponse)
async def me(user: UserRecord = Depends(get_current_user)) -> MeResponse:
    return MeResponse(user=_public_user(user))
