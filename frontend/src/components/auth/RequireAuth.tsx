import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../store/auth-context";
import LoadingScreen from "../core/LoadingScreen";

// Gate for authenticated app routes: waits for the /me check, then either
// renders the protected tree or bounces the visitor to the login screen.
function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  if (status === "loading") {
    return <LoadingScreen label="Checking your session…" />;
  }
  if (status === "anon") {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export default RequireAuth;
