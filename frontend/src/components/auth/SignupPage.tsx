import { FormEvent, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { LuUser, LuMail, LuLock, LuEye, LuEyeOff, LuSparkles } from "react-icons/lu";
import { useAuth } from "../../store/auth-context";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import AuthShell from "./AuthShell";

function scorePassword(password: string): number {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return Math.min(score, 4);
}

const STRENGTH_META = [
  { label: "Too short", color: "bg-slate-200 dark:bg-zinc-700", text: "text-slate-400" },
  { label: "Weak", color: "bg-rose-500", text: "text-rose-500" },
  { label: "Fair", color: "bg-amber-500", text: "text-amber-600" },
  { label: "Good", color: "bg-indigo-500", text: "text-indigo-600" },
  { label: "Strong", color: "bg-emerald-500", text: "text-emerald-600" },
];

function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const strength = useMemo(() => scorePassword(password), [password]);
  const strengthMeta = STRENGTH_META[strength];

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setSubmitting(true);
    try {
      await signup(email, name, password);
      toast.success("Account created — welcome to ScreGPT!");
      navigate("/app");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not create the account"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Turn screenshots into working code in seconds."
      footer={
        <>
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-indigo-600 transition-colors hover:text-indigo-500 dark:text-indigo-400"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <div className="relative">
            <LuUser className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              id="name"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ada Lovelace"
              className="pl-9"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <LuMail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="pl-9"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <LuLock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="pl-9 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            >
              {showPassword ? (
                <LuEyeOff className="h-4 w-4" />
              ) : (
                <LuEye className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Live strength meter */}
          <div className="space-y-1.5 pt-1">
            <div className="flex gap-1.5">
              {[0, 1, 2, 3].map((segment) => (
                <span
                  key={segment}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    strength > segment
                      ? strengthMeta.color
                      : "bg-slate-200 dark:bg-zinc-700"
                  }`}
                />
              ))}
            </div>
            <p
              className={`text-[11px] font-medium ${
                password ? strengthMeta.text : "text-slate-400"
              }`}
            >
              {password ? strengthMeta.label : "Use 8+ characters with a mix of letters, numbers & symbols."}
            </p>
          </div>
        </div>

        <Button
          type="submit"
          disabled={submitting}
          className="group mt-1 h-11 w-full gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 text-white shadow-soft transition-all hover:shadow-card hover:brightness-110 active:scale-[0.99]"
        >
          {submitting ? (
            "Creating account..."
          ) : (
            <>
              <LuSparkles className="h-4 w-4 transition-transform group-hover:rotate-12" />
              Create account
            </>
          )}
        </Button>
      </form>
    </AuthShell>
  );
}

export default SignupPage;
