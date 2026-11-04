from pathlib import Path

import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials

from routes.auth import (
    LoginRequest,
    SignupRequest,
    get_current_user,
    login,
    logout,
    me,
    signup,
)


def _credentials(token: str) -> HTTPAuthorizationCredentials:
    return HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)


@pytest.mark.asyncio
async def test_signup_login_and_session_lifecycle(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("SCRENGPT_DATA_DIR", str(tmp_path))

    created = await signup(
        SignupRequest(email="User@Example.com", name="Ada", password="supersecret")
    )
    assert created.user.email == "user@example.com"
    assert created.user.name == "Ada"
    assert created.token

    # /me resolves the session token to the user.
    who = await me(user=get_current_user(_credentials(created.token)))
    assert who.user.id == created.user.id
    assert who.user.email == "user@example.com"

    # Logging in with the correct password returns a fresh token.
    authed = await login(
        LoginRequest(email="user@example.com", password="supersecret")
    )
    assert authed.user.id == created.user.id

    # Logout invalidates that token.
    await logout(_credentials(authed.token))
    with pytest.raises(HTTPException) as exc:
        get_current_user(_credentials(authed.token))
    assert exc.value.status_code == 401


@pytest.mark.asyncio
async def test_login_rejects_wrong_password(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("SCRENGPT_DATA_DIR", str(tmp_path))

    await signup(
        SignupRequest(email="a@b.com", name="A", password="supersecret")
    )
    with pytest.raises(HTTPException) as exc:
        await login(LoginRequest(email="a@b.com", password="wrongwrong"))
    assert exc.value.status_code == 401


@pytest.mark.asyncio
async def test_signup_rejects_duplicate_email(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("SCRENGPT_DATA_DIR", str(tmp_path))

    await signup(SignupRequest(email="dup@x.com", name="D", password="supersecret"))
    with pytest.raises(HTTPException) as exc:
        await signup(SignupRequest(email="dup@x.com", name="D2", password="supersecret"))
    assert exc.value.status_code == 409


@pytest.mark.asyncio
async def test_signup_validates_email_and_password(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("SCRENGPT_DATA_DIR", str(tmp_path))

    with pytest.raises(HTTPException) as bad_email:
        await signup(SignupRequest(email="not-an-email", name="X", password="supersecret"))
    assert bad_email.value.status_code == 400

    with pytest.raises(HTTPException) as short_pw:
        await signup(SignupRequest(email="ok@x.com", name="X", password="short"))
    assert short_pw.value.status_code == 400


@pytest.mark.asyncio
async def test_me_requires_valid_token(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("SCRENGPT_DATA_DIR", str(tmp_path))

    with pytest.raises(HTTPException) as exc:
        get_current_user(None)
    assert exc.value.status_code == 401
