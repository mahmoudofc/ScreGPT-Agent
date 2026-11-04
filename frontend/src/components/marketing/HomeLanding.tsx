import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  LuWand2,
  LuLayers,
  LuImage,
  LuHistory,
  LuMousePointerClick,
  LuBot,
  LuSparkles,
  LuArrowRight,
  LuCheck,
  LuUpload,
  LuCode2,
  LuRocket,
  LuKeyRound,
  LuGitPullRequest,
  LuStar,
} from "react-icons/lu";
import MarketingLayout from "./MarketingLayout";
import Agent3D from "../core/Agent3D";

const FEATURES = [
  {
    icon: LuWand2,
    title: "Pixel-perfect UI",
    desc: "Drop in a screenshot or mockup and get clean, responsive markup that matches it.",
  },
  {
    icon: LuBot,
    title: "Autonomous agent",
    desc: "An AI engineer that plans the layout, writes the code, screenshots its own work and fixes the diffs — loop after loop until the result matches.",
  },
  {
    icon: LuLayers,
    title: "React · Tailwind · HTML",
    desc: "Export to the exact stack your team already ships, no rewrite needed.",
  },
  {
    icon: LuKeyRound,
    title: "Multi-key rotation",
    desc: "Stack several Gemini API keys in settings and ScreGPT rotates them across concurrent variants — more parallel generations, fewer rate limits.",
  },
  {
    icon: LuImage,
    title: "AI assets",
    desc: "Generate images, remove backgrounds and extract assets automatically.",
  },
  {
    icon: LuMousePointerClick,
    title: "Select & edit",
    desc: "Click any element in the live preview and tell the agent what to change.",
  },
  {
    icon: LuHistory,
    title: "Version history",
    desc: "Every generation is saved so you can branch, compare and roll back instantly.",
  },
];

const STEPS = [
  {
    icon: LuUpload,
    title: "Upload or describe",
    desc: "Paste a screenshot, drag a mockup, or simply describe the UI you want in plain text.",
  },
  {
    icon: LuBot,
    title: "The agent builds",
    desc: "ScreGPT plans the layout, writes the markup and visually verifies its own output.",
  },
  {
    icon: LuRocket,
    title: "Refine & ship",
    desc: "Iterate with chat, select elements to tweak, then export the code you need.",
  },
];

const STATS = [
  { value: "4", label: "stacks supported" },
  { value: "10s", label: "to first draft" },
  { value: "∞", label: "versions saved" },
  { value: "100%", label: "runs on your keys" },
];

const TESTIMONIALS = [
  {
    quote:
      "I dropped in a Figma export and got back React I could actually ship. It matched the spacing and type scale better than expected.",
    name: "Marta S.",
    role: "Front-end engineer",
  },
  {
    quote:
      "The agent screenshots its own work and fixes the diffs. Watching it iterate felt like pairing with a very patient teammate.",
    name: "Devin K.",
    role: "Indie founder",
  },
  {
    quote:
      "Bring-your-own-keys is the killer feature. Four Gemini keys rotating across four variants means no shared rate limits.",
    name: "Aisha R.",
    role: "Design tech lead",
  },
];

const MARQUEE_ITEMS = [
  "React",
  "Tailwind CSS",
  "HTML",
  "Bootstrap",
  "Screenshots",
  "Mockups",
  "Wireframes",
  "Design systems",
  "AI assets",
  "Version history",
  "Live preview",
  "Gemini multi-key",
];

// Entrance that fires when the section scrolls into view (once).
function useInView<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [inView]);
  return { ref, inView };
}

// Mouse-follow spotlight layered behind the hero content.
function HeroSpotlight() {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    const parent = host.parentElement;
    if (!parent) return;
    const onMove = (event: MouseEvent) => {
      const rect = parent.getBoundingClientRect();
      host.style.setProperty("--spot-x", `${((event.clientX - rect.left) / rect.width) * 100}%`);
      host.style.setProperty("--spot-y", `${((event.clientY - rect.top) / rect.height) * 100}%`);
    };
    parent.addEventListener("mousemove", onMove);
    return () => parent.removeEventListener("mousemove", onMove);
  }, []);
  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="spotlight-layer pointer-events-none absolute inset-0"
    />
  );
}

// Keyword ticker that loops forever (paused for reduced motion via CSS).
function MarqueeStrip() {
  return (
    <div className="relative overflow-hidden border-y border-slate-200/70 bg-white/60 py-4 dark:border-zinc-800/70 dark:bg-zinc-900/30">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-slate-50 to-transparent dark:from-zinc-950" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-slate-50 to-transparent dark:from-zinc-950" />
      <div className="marquee-track flex w-max items-center gap-10">
        {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, index) => (
          <span
            key={`${item}-${index}`}
            className="inline-flex items-center gap-2 whitespace-nowrap text-sm font-medium text-slate-400 dark:text-zinc-500"
          >
            <LuSparkles className="h-3.5 w-3.5 text-indigo-400/70" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

// Decorative screenshot→code preview drifting under the hero agent.
function HeroMock() {
  return (
    <div className="relative w-full max-w-md rounded-2xl border border-white/60 bg-white/70 p-3 shadow-card backdrop-blur-md dark:border-white/10 dark:bg-white/5">
      <div className="sheen pointer-events-none absolute inset-0 rounded-2xl opacity-40" />
      <div className="flex items-center gap-1.5 px-1 pb-2">
        <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
        <span className="ml-2 text-[10px] font-medium text-slate-400">preview.html</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
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
        <div className="rounded-xl bg-slate-900/90 p-2 font-mono text-[9px] leading-relaxed text-slate-200 dark:bg-black/50">
          <div className="text-fuchsia-300">{"<div"}</div>
          <div className="pl-2 text-indigo-300">class={"\"card\""}</div>
          <div className="text-fuchsia-300">{">"}</div>
          <div className="pl-2 text-emerald-300">{"<h1>Launch</h1>"}</div>
          <div className="pl-2 text-amber-200">{"<button>Get started</button>"}</div>
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

// Agent + mock stage: the 3D robot floats above the live "generation" card,
// with rotated tech chips orbiting the composition for depth.
function HeroStage() {
  return (
    <div className="relative flex flex-col items-center gap-6">
      {/* Halo ring behind the agent */}
      <div
        aria-hidden="true"
        className="absolute -top-4 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-gradient-to-br from-indigo-400/25 via-violet-400/20 to-fuchsia-400/25 blur-3xl"
      />
      <div className="float-3d relative">
        <Agent3D variant="full" working />
      </div>
      <div className="relative w-full flex justify-center">
        <HeroMock />
      </div>
      {/* Floating tech chips */}
      <span
        aria-hidden="true"
        className="absolute -left-1 top-[18%] hidden rounded-xl border border-indigo-200/70 bg-white/80 px-3 py-1.5 text-xs font-semibold text-indigo-600 shadow-soft backdrop-blur sm:block dark:border-indigo-400/30 dark:bg-indigo-400/10 dark:text-indigo-300"
        style={{ transform: "rotate(-6deg)" }}
      >
        React
      </span>
      <span
        aria-hidden="true"
        className="absolute -right-2 top-[30%] hidden rounded-xl border border-violet-200/70 bg-white/80 px-3 py-1.5 text-xs font-semibold text-violet-600 shadow-soft backdrop-blur sm:block dark:border-violet-400/30 dark:bg-violet-400/10 dark:text-violet-300"
        style={{ transform: "rotate(5deg)" }}
      >
        Tailwind
      </span>
      <span
        aria-hidden="true"
        className="absolute -left-3 bottom-[16%] hidden rounded-xl border border-fuchsia-200/70 bg-white/80 px-3 py-1.5 text-xs font-semibold text-fuchsia-600 shadow-soft backdrop-blur sm:block dark:border-fuchsia-400/30 dark:bg-fuchsia-400/10 dark:text-fuchsia-300"
        style={{ transform: "rotate(4deg)" }}
      >
        HTML
      </span>
      <span
        aria-hidden="true"
        className="absolute right-1 bottom-[6%] hidden items-center gap-1.5 rounded-xl border border-emerald-200/70 bg-white/80 px-3 py-1.5 text-xs font-semibold text-emerald-600 shadow-soft backdrop-blur sm:inline-flex dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300"
        style={{ transform: "rotate(-4deg)" }}
      >
        <LuCheck className="h-3.5 w-3.5" /> Verified by agent
      </span>
    </div>
  );
}

function FeaturesSection() {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <section ref={ref} className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <span
          className={`inline-flex items-center gap-2 rounded-full border border-indigo-200/70 bg-white/70 px-3 py-1 text-xs font-medium text-indigo-600 dark:border-indigo-400/30 dark:bg-indigo-400/10 dark:text-indigo-300 ${
            inView ? "rise-in-slow" : "opacity-0"
          }`}
        >
          <LuSparkles className="h-3.5 w-3.5" /> Capabilities
        </span>
        <h2
          className={`mt-4 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-4xl ${
            inView ? "rise-in-slow" : "opacity-0"
          }`}
          style={{ animationDelay: "80ms" }}
        >
          Everything you need to go from{" "}
          <span className="animated-brand-gradient">idea to interface</span>
        </h2>
        <p
          className={`mt-3 text-slate-600 dark:text-zinc-400 ${
            inView ? "rise-in-slow" : "opacity-0"
          }`}
          style={{ animationDelay: "160ms" }}
        >
          A complete AI workflow for building front-ends — not just a one-shot
          image-to-code demo.
        </p>
      </div>
      {/* Bento grid: two wide spotlight cards, then compact cards */}
      <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-6">
        {FEATURES.map((feature, index) => {
          const wide = index === 1 || index === 3;
          return (
            <div
              key={feature.title}
              className={`hover-ring card-lift group rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft dark:border-zinc-800 dark:bg-zinc-900/60 ${
                inView ? "rise-in-slow" : "opacity-0"
              } ${wide ? "lg:col-span-3" : "lg:col-span-2"}`}
              style={{ animationDelay: `${200 + index * 70}ms` }}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-soft transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                <feature.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">
                {feature.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-zinc-400">
                {feature.desc}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function StepsSection() {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <section
      ref={ref}
      className="border-y border-slate-200/70 bg-white/60 dark:border-zinc-800/70 dark:bg-zinc-900/30"
    >
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span
            className={`inline-flex items-center gap-2 rounded-full border border-indigo-200/70 bg-white/70 px-3 py-1 text-xs font-medium text-indigo-600 dark:border-indigo-400/30 dark:bg-indigo-400/10 dark:text-indigo-300 ${
              inView ? "rise-in-slow" : "opacity-0"
            }`}
          >
            <LuGitPullRequest className="h-3.5 w-3.5" /> Workflow
          </span>
          <h2
            className={`mt-4 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-4xl ${
              inView ? "rise-in-slow" : "opacity-0"
            }`}
            style={{ animationDelay: "80ms" }}
          >
            From screenshot to shipped in{" "}
            <span className="animated-brand-gradient">three steps</span>
          </h2>
        </div>
        <div className="relative mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Connector rail between the steps (desktop only) */}
          <div
            aria-hidden="true"
            className="absolute left-[16%] right-[16%] top-6 hidden h-0.5 bg-gradient-to-r from-indigo-400/60 via-violet-400/60 to-fuchsia-400/60 md:block"
          />
          {STEPS.map((step, index) => (
            <div
              key={step.title}
              className={`hover-ring card-lift relative rounded-2xl border border-slate-200/80 bg-white p-6 pt-10 shadow-soft dark:border-zinc-800 dark:bg-zinc-900/60 ${
                inView ? "rise-in-slow" : "opacity-0"
              }`}
              style={{ animationDelay: `${180 + index * 120}ms` }}
            >
              <span className="absolute -top-6 left-1/2 flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-base font-bold text-white shadow-card ring-pulse">
                {index + 1}
              </span>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
                <step.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">
                {step.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-zinc-400">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <section ref={ref} className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <span
          className={`inline-flex items-center gap-2 rounded-full border border-indigo-200/70 bg-white/70 px-3 py-1 text-xs font-medium text-indigo-600 dark:border-indigo-400/30 dark:bg-indigo-400/10 dark:text-indigo-300 ${
            inView ? "rise-in-slow" : "opacity-0"
          }`}
        >
          <LuStar className="h-3.5 w-3.5" /> Loved by builders
        </span>
        <h2
          className={`mt-4 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-4xl ${
            inView ? "rise-in-slow" : "opacity-0"
          }`}
          style={{ animationDelay: "80ms" }}
        >
          What people build{" "}
          <span className="animated-brand-gradient">with ScreGPT</span>
        </h2>
      </div>
      <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
        {TESTIMONIALS.map((testimonial, index) => (
          <figure
            key={testimonial.name}
            className={`hover-ring card-lift flex flex-col rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft dark:border-zinc-800 dark:bg-zinc-900/60 ${
              inView ? "rise-in-slow" : "opacity-0"
            }`}
            style={{ animationDelay: `${160 + index * 90}ms` }}
          >
            <div className="flex gap-0.5 text-amber-400">
              {Array.from({ length: 5 }).map((_, star) => (
                <LuStar key={star} className="h-4 w-4 fill-current" />
              ))}
            </div>
            <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-slate-600 dark:text-zinc-300">
              &ldquo;{testimonial.quote}&rdquo;
            </blockquote>
            <figcaption className="mt-5 flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-xs font-semibold uppercase text-white shadow-soft">
                {testimonial.name.slice(0, 1)}
              </span>
              <span className="flex flex-col">
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  {testimonial.name}
                </span>
                <span className="text-xs text-slate-500 dark:text-zinc-400">
                  {testimonial.role}
                </span>
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

function CtaSection() {
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <section ref={ref} className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div
        className={`brand-backdrop relative overflow-hidden rounded-3xl border border-white/60 px-8 py-16 text-center shadow-card dark:border-white/10 sm:px-16 ${
          inView ? "rise-in-slow" : "opacity-0"
        }`}
      >
        <div aria-hidden="true" className="dot-grid dot-grid-pan absolute inset-0 opacity-40" />
        <div
          aria-hidden="true"
          className="aurora-blob pointer-events-none absolute -right-10 -top-12 h-56 w-56 rounded-full bg-fuchsia-400/30 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="aurora-blob aurora-blob-2 pointer-events-none absolute -bottom-14 -left-10 h-56 w-56 rounded-full bg-indigo-400/30 blur-3xl"
        />
        {/* Sweeping beam along the top edge */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-px overflow-hidden"
        >
          <span className="beam-sweep absolute top-0 h-px w-1/3 bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
        </div>
        <div className="relative mx-auto max-w-2xl">
          <div className="pop-in mx-auto flex w-fit justify-center">
            <Agent3D variant="full" working />
          </div>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Ready to build your next interface{" "}
            <span className="animated-brand-gradient">faster?</span>
          </h2>
          <p className="mt-3 text-slate-600 dark:text-zinc-300">
            Create a free account and turn your first screenshot into code in
            under a minute — bring as many Gemini keys as you like.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 bg-[length:150%_auto] px-6 py-3 text-sm font-semibold text-white shadow-soft transition-all hover:bg-[position:right_center] hover:shadow-card active:scale-[0.98]"
            >
              Create your account <LuArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/about"
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white/70 px-6 py-3 text-sm font-semibold text-slate-800 transition-colors hover:bg-white dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-100 dark:hover:bg-zinc-900"
            >
              Learn more
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function HomeLanding() {
  const { ref: heroRef, inView: heroInView } = useInView<HTMLDivElement>();
  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="brand-backdrop relative overflow-hidden">
        <div
          aria-hidden="true"
          className="dot-grid dot-grid-pan absolute inset-0 opacity-50"
        />
        <HeroSpotlight />
        {/* Aurora blobs drifting behind the headline */}
        <div
          aria-hidden="true"
          className="aurora-blob pointer-events-none absolute -left-16 top-4 h-72 w-72 rounded-full bg-indigo-400/35 blur-3xl dark:bg-indigo-500/25"
        />
        <div
          aria-hidden="true"
          className="aurora-blob aurora-blob-2 pointer-events-none absolute right-[-4rem] top-24 h-80 w-80 rounded-full bg-fuchsia-400/35 blur-3xl dark:bg-fuchsia-500/25"
        />
        <div
          aria-hidden="true"
          className="aurora-blob aurora-blob-3 pointer-events-none absolute bottom-4 left-1/3 h-64 w-64 rounded-full bg-violet-400/30 blur-3xl dark:bg-violet-500/20"
        />
        <div
          ref={heroRef}
          className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 pb-16 pt-20 sm:px-6 lg:grid-cols-2 lg:pb-24 lg:pt-28"
        >
          <div>
            <span
              className={`inline-flex items-center gap-2 rounded-full border border-indigo-200/70 bg-white/60 px-3 py-1 text-xs font-medium text-indigo-600 backdrop-blur dark:border-indigo-400/30 dark:bg-indigo-400/10 dark:text-indigo-300 ${
                heroInView ? "rise-in-slow" : "opacity-0"
              }`}
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Screenshot → Code, powered by an AI agent
            </span>
            <h1
              className={`mt-5 text-4xl font-semibold leading-[1.08] tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-[3.4rem] ${
                heroInView ? "rise-in-slow" : "opacity-0"
              }`}
              style={{ animationDelay: "90ms" }}
            >
              Turn any screenshot into{" "}
              <span className="animated-brand-gradient">working code</span>{" "}
              in seconds
            </h1>
            <p
              className={`mt-5 max-w-xl text-lg text-slate-600 dark:text-zinc-300 ${
                heroInView ? "rise-in-slow" : "opacity-0"
              }`}
              style={{ animationDelay: "180ms" }}
            >
              ScreGPT is your AI front-end engineer. Upload a design or describe
              an idea and get clean React, Tailwind or HTML in seconds — then
              refine it through chat.
            </p>
            <div
              className={`mt-8 flex flex-col gap-3 sm:flex-row ${
                heroInView ? "rise-in-slow" : "opacity-0"
              }`}
              style={{ animationDelay: "270ms" }}
            >
              <Link
                to="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 bg-[length:150%_auto] px-6 py-3 text-sm font-semibold text-white shadow-soft transition-all hover:bg-[position:right_center] hover:shadow-card active:scale-[0.98]"
              >
                Start building free <LuArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/app"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white/70 px-6 py-3 text-sm font-semibold text-slate-800 backdrop-blur transition-colors hover:bg-white dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-100 dark:hover:bg-zinc-900"
              >
                <LuCode2 className="h-4 w-4" /> Launch the studio
              </Link>
            </div>
            <div
              className={`mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500 dark:text-zinc-400 ${
                heroInView ? "rise-in-slow" : "opacity-0"
              }`}
              style={{ animationDelay: "360ms" }}
            >
              {[
                "No design specs to learn",
                "Bring your own API keys",
                "Your work stays on your device",
              ].map((item) => (
                <span key={item} className="inline-flex items-center gap-1.5">
                  <LuCheck className="h-4 w-4 text-emerald-500" />
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div
            className={`flex justify-center lg:justify-end ${
              heroInView ? "rise-in-slow" : "opacity-0"
            }`}
            style={{ animationDelay: "220ms" }}
          >
            <HeroStage />
          </div>
        </div>

        {/* Stats */}
        <div className="relative mx-auto max-w-6xl px-4 pb-16 sm:px-6">
          <div
            className={`grid grid-cols-2 gap-4 rounded-2xl border border-white/60 bg-white/60 p-6 shadow-soft backdrop-blur dark:border-white/10 dark:bg-white/5 sm:grid-cols-4 ${
              heroInView ? "rise-in-slow" : "opacity-0"
            }`}
            style={{ animationDelay: "430ms" }}
          >
            {STATS.map((stat) => (
              <div key={stat.label} className="group text-center">
                <p className="animated-brand-gradient text-3xl font-bold transition-transform duration-300 group-hover:scale-110">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-zinc-400">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <MarqueeStrip />

      <FeaturesSection />
      <StepsSection />
      <TestimonialsSection />
      <CtaSection />
    </MarketingLayout>
  );
}

export default HomeLanding;
