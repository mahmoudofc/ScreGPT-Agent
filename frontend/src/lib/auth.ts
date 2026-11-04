import { HTTP_BACKEND_URL } from "../config";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

const TOKEN_STORAGE_KEY = "screngpt-token";

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch {
    // Ignore storage failures (private mode / quota); auth will fall back to anon.
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // Ignore.
  }
}

async function request(path: string, init: RequestInit): Promise<Response> {
  return fetch(`${HTTP_BACKEND_URL}${path}`, init);
}

function jsonHeaders(token?: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

async function readError(response: Response, fallback: string): Promise<string> {
  try {
    const data = await response.json();
    if (data && typeof data.detail === "string") {
      return data.detail;
    }
  } catch {
    // Fall through to the generic message.
  }
  return fallback;
}

export async function signup(
  email: string,
  name: string,
  password: string
): Promise<AuthResponse> {
  const response = await request("/api/auth/signup", {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ email, name, password }),
  });
  if (!response.ok) {
    throw new Error(await readError(response, "Could not create the account"));
  }
  return (await response.json()) as AuthResponse;
}

export async function login(
  email: string,
  password: string
): Promise<AuthResponse> {
  const response = await request("/api/auth/login", {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    throw new Error(await readError(response, "Invalid email or password"));
  }
  return (await response.json()) as AuthResponse;
}

export async function fetchMe(token: string): Promise<AuthUser | null> {
  const response = await request("/api/auth/me", {
    method: "GET",
    headers: jsonHeaders(token),
  });
  if (!response.ok) {
    return null;
  }
  const data = (await response.json()) as { user: AuthUser };
  return data.user;
}

export async function logout(token: string | null): Promise<void> {
  if (!token) {
    return;
  }
  try {
    await request("/api/auth/logout", {
      method: "POST",
      headers: jsonHeaders(token),
    });
  } catch {
    // Best-effort: the client clears the token regardless.
  }
}
