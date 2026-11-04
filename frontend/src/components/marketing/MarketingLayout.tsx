import { ReactNode, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { LuMenu, LuX, LuGithub, LuArrowRight, LuBookOpen } from "react-icons/lu";
import Logo from "../core/Logo";
import { useAuth } from "../../store/auth-context";

export const REPO_URL = "https://github.com/mahmoudofc/ScreGPT";

const NAV_LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/templates", label: "Templates", end: false },
  { to: "/pricing", label: "Pricing", end: false },
  { to: "/about", label: "About", end: false },
  { to: "/contact", label: "Contact", end: false },
];

function Navbar() {
  const { status } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      isActive
        ? "text-indigo-600 dark:text-indigo-300"
        : "text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white"
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/70 backdrop-blur-xl dark:border-zinc-800/70 dark:bg-zinc-950/70">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" aria-label="ScreGPT home" className="shrink-0">
          <Logo />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className={linkClass}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Desktop actions */}
        <div className="hidden items-center gap-2 md:flex">
          {status === "authed" ? (
            <Link
              to="/app"
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-white shadow-soft transition-all hover:shadow-card hover:brightness-110 active:scale-[0.98]"
            >
              Open studio
              <LuArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-xl px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Sign in
              </Link>
              <Link
                to="/signup"
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-white shadow-soft transition-all hover:shadow-card hover:brightness-110 active:scale-[0.98]"
              >
                Get started
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label="Toggle menu"
          className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-zinc-800 md:hidden"
        >
          {mobileOpen ? <LuX className="h-5 w-5" /> : <LuMenu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-slate-200/70 bg-white px-4 py-4 dark:border-zinc-800/70 dark:bg-zinc-950 md:hidden">
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300"
                      : "text-slate-600 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-3 flex flex-col gap-2">
            {status === "authed" ? (
              <Link
                to="/app"
                onClick={() => setMobileOpen(false)}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 px-4 py-2.5 text-sm font-semibold text-white shadow-soft"
              >
                Open studio <LuArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/signup"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 px-4 py-2.5 text-sm font-semibold text-white shadow-soft"
                >
                  Get started
                </Link>
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 dark:border-zinc-700 dark:text-zinc-200"
                >
                  Sign in
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-slate-200/70 bg-white dark:border-zinc-800/70 dark:bg-zinc-950">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Logo />
            <p className="mt-3 max-w-xs text-sm text-slate-500 dark:text-zinc-400">
              Your AI front-end engineer. Turn any screenshot, mockup or prompt
              into clean, production-ready code.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              Product
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link to="/" className="text-slate-600 transition-colors hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-300">Home</Link></li>
              <li><Link to="/templates" className="text-slate-600 transition-colors hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-300">Templates</Link></li>
              <li><Link to="/pricing" className="text-slate-600 transition-colors hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-300">Pricing</Link></li>
              <li><Link to="/about" className="text-slate-600 transition-colors hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-300">About</Link></li>
              <li><Link to="/contact" className="text-slate-600 transition-colors hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-300">Contact</Link></li>
              <li><Link to="/app" className="text-slate-600 transition-colors hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-300">Open studio</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              Resources
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <a
                  href={REPO_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-slate-600 transition-colors hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-300"
                >
                  <LuGithub className="h-4 w-4" /> GitHub
                </a>
              </li>
              <li>
                <a
                  href={`${REPO_URL}/wiki`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-slate-600 transition-colors hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-300"
                >
                  <LuBookOpen className="h-4 w-4" /> Wiki
                </a>
              </li>
              <li>
                <Link to="/signup" className="text-slate-600 transition-colors hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-300">
                  Create account
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-slate-200/70 pt-6 text-xs text-slate-400 dark:border-zinc-800/70 dark:text-zinc-500 sm:flex-row">
          <p>© {year} ScreGPT. All rights reserved.</p>
          <p>Built for designers &amp; developers — screenshot to code.</p>
        </div>
      </div>
    </footer>
  );
}

interface MarketingLayoutProps {
  children: ReactNode;
}

// Shared shell for the public marketing pages (Home / About / Contact):
// a sticky glass navbar, page content and a rich footer.
function MarketingLayout({ children }: MarketingLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 dark:bg-zinc-950 dark:text-white">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

export default MarketingLayout;
