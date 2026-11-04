import { useEffect, useState } from "react";
import Agent3D from "./Agent3D";

const TAGLINES = [
  "Warming up the design studio…",
  "Teaching pixels to behave…",
  "Turning screenshots into components…",
  "Brewing a clean codebase…",
  "Assembling your front-end engineer…",
];

interface LoadingScreenProps {
  // Optional message override; when omitted, taglines rotate.
  label?: string;
}

// A branded full-screen splash used while the app bootstraps / checks auth.
function LoadingScreen({ label }: LoadingScreenProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (label) return;
    const id = window.setInterval(
      () => setIndex((prev) => (prev + 1) % TAGLINES.length),
      2400
    );
    return () => window.clearInterval(id);
  }, [label]);

  return (
    <div className="brand-backdrop relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden px-6">
      {/* Floating orbs */}
      <div
        aria-hidden="true"
        className="orb-float pointer-events-none absolute left-1/4 top-1/4 h-52 w-52 rounded-full bg-indigo-400/25 blur-3xl dark:bg-indigo-500/20"
      />
      <div
        aria-hidden="true"
        className="orb-float pointer-events-none absolute bottom-1/4 right-1/4 h-56 w-56 rounded-full bg-fuchsia-400/25 blur-3xl dark:bg-fuchsia-500/20"
        style={{ animationDelay: "-3.5s" }}
      />

      <div className="relative flex flex-col items-center">
        {/* Floating 3D agent as the centerpiece */}
        <div className="pop-in mb-4">
          <Agent3D variant="full" working />
        </div>

        <div className="mb-1 flex items-center gap-2">
          <span className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Scre
          </span>
          <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 bg-clip-text text-2xl font-semibold tracking-tight text-transparent">
            GPT
          </span>
        </div>

        {/* Rotating / provided label */}
        <p
          key={label ?? index}
          className="fade-swap mt-2 text-sm text-slate-500 dark:text-zinc-400"
        >
          {label ?? TAGLINES[index]}
        </p>

        {/* Indeterminate progress bar */}
        <div className="mt-7 h-1.5 w-56 overflow-hidden rounded-full bg-slate-200/80 dark:bg-zinc-800">
          <div className="load-bar h-full w-2/3 rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500" />
        </div>

        {/* Typing dots */}
        <div className="mt-6 flex items-center gap-1.5">
          {[0, 1, 2].map((dot) => (
            <span
              key={dot}
              className="typing-dot h-2 w-2 rounded-full bg-indigo-500/70 dark:bg-indigo-400/70"
              style={{ animationDelay: `${dot * 0.18}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default LoadingScreen;
