import { Link } from "react-router-dom";
import {
  LuTarget,
  LuShieldCheck,
  LuZap,
  LuGithub,
  LuArrowRight,
  LuLayers,
  LuGitBranch,
  LuEye,
} from "react-icons/lu";
import MarketingLayout, { REPO_URL } from "./MarketingLayout";

const VALUES = [
  {
    icon: LuZap,
    title: "Speed without shortcuts",
    desc: "Ship real, editable code in seconds — no brittle pixel soup, no lock-in.",
  },
  {
    icon: LuEye,
    title: "Self-verifying",
    desc: "The agent screenshots its own output and fixes layout issues before you see them.",
  },
  {
    icon: LuShieldCheck,
    title: "Private by default",
    desc: "Your API keys and projects live in your browser. Nothing leaves your device.",
  },
  {
    icon: LuLayers,
    title: "Own your stack",
    desc: "React, Tailwind, HTML or vanilla — export in whatever your team already uses.",
  },
];

const CAPABILITIES = [
  {
    icon: LuGitBranch,
    title: "Version history & branching",
    desc: "Every generation becomes a commit. Branch from any past version and compare variants side by side.",
  },
  {
    icon: LuEye,
    title: "Live preview & select-to-edit",
    desc: "Click any element in the rendered page and describe the change — the agent edits precisely that node.",
  },
  {
    icon: LuLayers,
    title: "Design systems",
    desc: "Feed ScreGPT your tokens and components so generated UI matches your brand from the first draft.",
  },
];

function AboutPage() {
  return (
    <MarketingLayout>
      {/* Intro */}
      <section className="brand-backdrop relative overflow-hidden">
        <div aria-hidden="true" className="dot-grid absolute inset-0 opacity-50" />
        <div
          aria-hidden="true"
          className="orb-float pointer-events-none absolute -left-10 top-0 h-64 w-64 rounded-full bg-indigo-400/30 blur-3xl dark:bg-indigo-500/20"
        />
        <div className="relative mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 lg:py-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200/70 bg-white/60 px-3 py-1 text-xs font-medium text-indigo-600 backdrop-blur dark:border-indigo-400/30 dark:bg-indigo-400/10 dark:text-indigo-300">
            About ScreGPT
          </span>
          <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight text-slate-900 dark:text-white sm:text-5xl">
            An AI engineer that thinks in{" "}
            <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
              interfaces
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600 dark:text-zinc-300">
            ScreGPT started with a simple idea: the fastest way to describe a UI
            is to show it. We turn screenshots, mockups and plain-English ideas
            into clean code you actually want to maintain.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
              Our mission
            </h2>
            <p className="mt-4 text-slate-600 dark:text-zinc-400">
              We want everyone — designers, founders, developers — to move from
              an idea to a working interface without friction. ScreGPT handles
              the boilerplate so you can focus on the parts that need a human:
              taste, judgment and intent.
            </p>
            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft dark:border-zinc-800 dark:bg-zinc-900/60">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white">
                <LuTarget className="h-5 w-5" />
              </span>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-zinc-300">
                Make front-end development feel like a conversation: show what
                you mean, iterate in plain language, and keep every step
                reversible.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {VALUES.map((value) => (
              <div
                key={value.title}
                className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:border-indigo-200 dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-indigo-700"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
                  <value.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">
                  {value.title}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-zinc-400">
                  {value.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="border-y border-slate-200/70 bg-white/60 dark:border-zinc-800/70 dark:bg-zinc-900/30">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-center text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            What makes it different
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            {CAPABILITIES.map((cap) => (
              <div key={cap.title} className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft dark:border-zinc-800 dark:bg-zinc-900/60">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-soft">
                  <cap.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">
                  {cap.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-zinc-400">
                  {cap.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Open source CTA */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="brand-backdrop relative overflow-hidden rounded-3xl border border-white/60 px-8 py-12 shadow-card dark:border-white/10 sm:px-12">
          <div aria-hidden="true" className="dot-grid absolute inset-0 opacity-40" />
          <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="max-w-xl">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
                Built in the open
              </h2>
              <p className="mt-2 text-slate-600 dark:text-zinc-300">
                ScreGPT grows from a community of designers and engineers. Explore
                the source, file an issue, or contribute a feature.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href={REPO_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white/70 px-5 py-3 text-sm font-semibold text-slate-800 transition-colors hover:bg-white dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-100 dark:hover:bg-zinc-900"
              >
                <LuGithub className="h-4 w-4" /> View on GitHub
              </a>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 px-5 py-3 text-sm font-semibold text-white shadow-soft transition-all hover:shadow-card hover:brightness-110"
              >
                Get in touch <LuArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}

export default AboutPage;
