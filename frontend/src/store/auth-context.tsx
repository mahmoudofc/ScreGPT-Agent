// Colocating the AuthProvider component and the useAuth hook is intentional;
// the shared context type isn't a live binding, so fast-refresh granularity is
// an acceptable trade-off here.
/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  AuthUser,
  clearToken,
  fetchMe,
  getToken,
  login as loginRequest,
  logout as logoutRequest,
  setToken,
  signup as signupRequest,
} from "../lib/auth";

type AuthStatus = "loading" | "authed" | "anon";

interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, name: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    let cancelled = false;
    const token = getToken();
    if (!token) {
      setStatus("anon");
      return;
    }
    fetchMe(token)
      .then((resolved) => {
        if (cancelled) return;
        if (resolved) {
          setUser(resolved);
          setStatus("authed");
        } else {
          clearToken();
          setStatus("anon");
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("anon");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await loginRequest(email, password);
    setToken(response.token);
    setUser(response.user);
    setStatus("authed");
  }, []);

  const signup = useCallback(
    async (email: string, name: string, password: string) => {
      const response = await signupRequest(email, name, password);
      setToken(response.token);
      setUser(response.user);
      setStatus("authed");
    },
    []
  );

  const logout = useCallback(async () => {
    await logoutRequest(getToken());
    clearToken();
    setUser(null);
    setStatus("anon");
  }, []);

  const value = useMemo(
    () => ({ user, status, login, signup, logout }),
    [user, status, login, signup, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
