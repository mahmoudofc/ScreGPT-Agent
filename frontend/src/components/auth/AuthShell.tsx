import { ReactNode, useEffect, useState } from "react";
import {
  LuWand2,
  LuLayers,
  LuImage,
  LuHistory,
  LuSparkles,
  LuBot,
  LuCheck,
} from "react-icons/lu";
import Logo from "../core/Logo";

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}

const FEATURES = [
  {
    icon: LuWand2,
    title: "Pixel-perfect UI",
    desc: "Turn any screenshot or mockup into clean, responsive markup.",
  },
  {
    icon: LuLayers,
    title: "React · Tailwind · HTML",
    desc: "Export to the exact stack your team already ships.",
  },
  {
    icon: LuImage,
    title: "AI assets",
    desc: "Generate images, remove backgrounds and extract assets.",
  },
  {
    icon: LuHistory,
    title: "Version history",
    desc: "Every generation is saved so you can roll back instantly.",
  },
];

const HIGHLIGHTS = [
  "Screenshot to code in seconds",
  "Select any element and edit it live",
  "An agent that plans, codes & reviews",
  "Bring your own design system",
];

// A decorative, self-contained "screenshot → code" animation for the showcase.
function ShowcaseMock() {
  return (
    <div className="relative mt-8 w-full max-w-sm rounded-2xl border border-white/50 bg-white/70 p-3 shadow-card backdrop-blur-md dark:border-white/10 dark:bg-white/5">
      <div className="flex items-center gap-1.5 px-1 pb-2">
        <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
        <span className="ml-2 text-[10px] font-medium text-slate-400">
          preview.html
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {/* Screenshot side */}
        <div className="relative overflow-hidden rounded-xl border border-slate-200/70 bg-gradient-to-br from-slate-100 to-indigo-100 p-2 dark:border-white/10 dark:from-zinc-800 dark:to-zinc-700">
          <span className="progress-sweep pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/70 to-transparent dark:via-indigo-300/20" />
          <div className="h-3 w-3/4 rounded bg-indigo-400/60" />
          <div className="mt-1.5 h-2 w-full rounded bg-slate-300/70 dark:bg-zinc-600" />
          <div className="mt-1 h-2 w-5/6 rounded bg-slate-300/70 dark:bg-zinc-600" />
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            <div className="aspect-square rounded-lg bg-fuchsia-300/60" />
            <div className="aspect-square rounded-lg bg-violet-300/60" />
          </div>
        </div>
        {/* Code side */}
        <div className="rounded-xl bg-slate-900/90 p-2 font-mono text-[9px] leading-relaxed text-slate-200 dark:bg-black/50">
          <div className="text-fuchsia-300">{"<div"}</div>
          <div className="pl-2 text-indigo-300">class={"\"card\""}</div>
          <div className="text-fuchsia-300">{">"}</div>
          <div className="pl-2 text-emerald-300">{"<h1>Launch</h1>"}</div>
          <div className="pl-2 text-amber-200">
            {"<button>Get started</button>"}
          </div>
          <div className="text-fuchsia-300">{"</div>"}</div>
          <span className="inline-block h-3 w-1.5 animate-pulse bg-indigo-400 align-middle" />
        </div>
      </div>
      <div className="mt-2 flex items-center justify-center gap-1 text-[10px] font-medium text-indigo-500 dark:text-indigo-300">
        <LuBot className="h-3 w-3" />
        Generating with ScreGPT agent…
      </div>
    </div>
  );
}

function Showcase() {
  const [highlight, setHighlight] = useState(0);

  useEffect(() => {
    const id = window.setInterval(
      () => setHighlight((prev) => (prev + 1) % HIGHLIGHTS.length),
      5000
    );
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden brand-backdrop p-10 lg:flex xl:p-14">
      {/* Decorative animated background */}
      <div aria-hidden="true" className="dot-grid absolute inset-0 opacity-60" />
      <div
        aria-hidden="true"
        className="orb-float pointer-events-none absolute -left-10 top-24 h-56 w-56 rounded-full bg-indigo-400/30 blur-3xl dark:bg-indigo-500/25"
      />
      <div
        aria-hidden="true"
        className="orb-float pointer-events-none absolute bottom-10 right-0 h-64 w-64 rounded-full bg-fuchsia-400/30 blur-3xl dark:bg-fuchsia-500/20"
        style={{ animationDelay: "-3s" }}
      />

      {/* Brand header */}
      <div className="relative flex items-center gap-3">
        <Logo size="md" />
        <span className="rounded-full border border-indigo-200/70 bg-white/60 px-2.5 py-1 text-[11px] font-medium text-indigo-600 backdrop-blur dark:border-indigo-400/30 dark:bg-indigo-400/10 dark:text-indigo-300">
          Screenshot → Code
        </span>
      </div>

      {/* Headline + features */}
      <div className="relative max-w-lg">
        <h2 className="text-3xl font-semibold leading-tight tracking-tight text-slate-900 dark:text-white xl:text-4xl">
          Build{" "}
          <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
            production-ready UI
          </span>{" "}
          from any screenshot.
        </h2>
        <p className="mt-3 text-sm text-slate-600 dark:text-zinc-300">
          ScreGPT is your AI front-end engineer — design, code and ship in one
          flow.
        </p>

        <ul className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {FEATURES.map((feature) => (
            <li
              key={feature.title}
              className="group flex items-start gap-3 rounded-xl border border-white/60 bg-white/50 p-3 shadow-soft backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-white/70 dark:border-white/10 dark:bg-white/5 dark:hover:border-indigo-400/30 dark:hover:bg-white/10"
            >
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-soft transition-transform group-hover:scale-110">
                <feature.icon className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-zinc-100">
                  {feature.title}
                </p>
                <p className="text-xs leading-snug text-slate-500 dark:text-zinc-400">
                  {feature.desc}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Mock + rotating highlight */}
      <div className="relative flex flex-col items-start gap-5">
        <ShowcaseMock />
        <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-zinc-300">
          <LuSparkles className="h-4 w-4 text-indigo-500" />
          <span key={highlight} className="fade-swap">
            {HIGHLIGHTS[highlight]}
          </span>
        </div>
      </div>
    </div>
  );
}

// Split-screen auth layout: an animated ScreGPT showcase on the left and the
// centered form card on the right. Shares the brand backdrop for both modes.
function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="flex min-h-screen w-full bg-slate-50 dark:bg-zinc-950">
      <Showcase />

      {/* Form side */}
      <div className="brand-backdrop relative flex w-full flex-col items-center justify-center overflow-hidden px-4 py-10 lg:w-1/2">
        <div className="relative w-full max-w-md">
          {/* Compact brand for small screens */}
          <div className="mb-6 flex justify-center lg:hidden">
            <Logo size="md" />
          </div>

          <div className="mb-6 text-center lg:text-left">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
              {title}
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
              {subtitle}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-card backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/70 sm:p-8">
            {children}
          </div>

          <div className="mt-6 text-center text-sm text-slate-500 dark:text-zinc-400">
            {footer}
          </div>

          {/* Trust line */}
          <div className="mt-5 flex items-center justify-center gap-2 text-[11px] text-slate-400 dark:text-zinc-500">
            <LuCheck className="h-3.5 w-3.5 text-emerald-500" />
            Your API keys and projects stay on your own device.
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthShell;
