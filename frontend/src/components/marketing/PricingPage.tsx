import { useState } from "react";
import { Link } from "react-router-dom";
import {
  LuCheck,
  LuArrowRight,
  LuSparkles,
  LuKeyRound,
  LuChevronDown,
} from "react-icons/lu";
import MarketingLayout from "./MarketingLayout";
import Agent3D from "../core/Agent3D";

interface Plan {
  name: string;
  tagline: string;
  monthly: number;
  yearly: number;
  cta: string;
  href: string;
  highlighted?: boolean;
  features: string[];
}

const PLANS: Plan[] = [
  {
    name: "Hobby",
    tagline: "Bring your own keys, run it locally.",
    monthly: 0,
    yearly: 0,
    cta: "Start free",
    href: "/signup",
    features: [
      "Unlimited generations on your keys",
      "React · Tailwind · HTML · Bootstrap",
      "Version history & branching",
      "Select-and-edit in the live preview",
      "Runs entirely on your device",
    ],
  },
  {
    name: "Pro",
    tagline: "Hosted compute + AI asset generation.",
    monthly: 19,
    yearly: 15,
    cta: "Go Pro",
    href: "/signup",
    highlighted: true,
    features: [
      "Everything in Hobby",
      "Hosted Gemini — no key needed",
      "AI image generation & background removal",
      "Priority variant queue (4-way parallel)",
      "Export to ZIP & shareable previews",
    ],
  },
  {
    name: "Team",
    tagline: "For design & front-end teams shipping together.",
    monthly: 49,
    yearly: 39,
    cta: "Talk to us",
    href: "/contact",
    features: [
      "Everything in Pro",
      "Shared design systems & templates",
      "Centralized billing & seat management",
      "Role-based project workspaces",
      "SSO & priority support",
    ],
  },
];

const FAQS = [
  {
    q: "Do I need my own API key?",
    a: "On the Hobby plan you bring your own Gemini key and everything runs on your device. Pro and Team include hosted compute so you can generate without managing keys.",
  },
  {
    q: "Can I rotate multiple keys?",
    a: "Yes. Stack up to four Gemini keys and ScreGPT rotates them across concurrent variants — more parallel generations and fewer rate-limit hits.",
  },
  {
    q: "What stacks can I export?",
    a: "React, Tailwind, plain HTML and Bootstrap. The agent targets the stack you pick, so the output drops straight into your existing project.",
  },
  {
    q: "Is my work private?",
    a: "Your projects, keys and history are stored locally in your browser. Nothing is uploaded unless you explicitly enable a hosted feature.",
  },
];

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white shadow-soft dark:border-zinc-800 dark:bg-zinc-900/60">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="text-sm font-semibold text-slate-900 dark:text-white">
          {question}
        </span>
        <LuChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`grid transition-all duration-300 ease-out ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <p className="px-5 pb-5 text-sm leading-relaxed text-slate-600 dark:text-zinc-400">
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
}

function PricingPage() {
  const [yearly, setYearly] = useState(true);

  return (
    <MarketingLayout>
      {/* Header band */}
      <section className="brand-backdrop relative overflow-hidden">
        <div aria-hidden="true" className="dot-grid dot-grid-pan absolute inset-0 opacity-50" />
        <div
          aria-hidden="true"
          className="aurora-blob pointer-events-none absolute -left-16 top-0 h-72 w-72 rounded-full bg-indigo-400/30 blur-3xl dark:bg-indigo-500/20"
        />
        <div
          aria-hidden="true"
          className="aurora-blob aurora-blob-2 pointer-events-none absolute right-[-3rem] top-16 h-72 w-72 rounded-full bg-fuchsia-400/30 blur-3xl dark:bg-fuchsia-500/20"
        />
        <div className="relative mx-auto max-w-6xl px-4 pb-10 pt-16 text-center sm:px-6 lg:pt-20">
          <div className="pop-in mx-auto flex w-fit justify-center">
            <Agent3D variant="avatar" mood="idle" />
          </div>
          <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-indigo-200/70 bg-white/70 px-3 py-1 text-xs font-medium text-indigo-600 backdrop-blur dark:border-indigo-400/30 dark:bg-indigo-400/10 dark:text-indigo-300">
            <LuKeyRound className="h-3.5 w-3.5" /> Bring your own keys, or don&apos;t
          </span>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
            Simple, honest{" "}
            <span className="animated-brand-gradient">pricing</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600 dark:text-zinc-300">
            Start free on your own keys. Upgrade only when you want hosted
            compute, AI assets and team features.
          </p>

          {/* Billing toggle */}
          <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white/70 p-1 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/60">
            <button
              type="button"
              onClick={() => setYearly(false)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                !yearly
                  ? "bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 text-white shadow-soft"
                  : "text-slate-600 dark:text-zinc-300"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setYearly(true)}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                yearly
                  ? "bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 text-white shadow-soft"
                  : "text-slate-600 dark:text-zinc-300"
              }`}
            >
              Yearly
              <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                -20%
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {PLANS.map((plan) => {
            const price = yearly ? plan.yearly : plan.monthly;
            return (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-3xl border p-7 shadow-soft transition-transform duration-300 hover:-translate-y-1 ${
                  plan.highlighted
                    ? "border-transparent bg-gradient-to-b from-indigo-500 via-violet-500 to-fuchsia-500 text-white shadow-card lg:scale-[1.03]"
                    : "border-slate-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900/60"
                }`}
              >
                {plan.highlighted && (
                  <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-indigo-600 shadow-soft">
                    <LuSparkles className="h-3 w-3" /> Most popular
                  </span>
                )}
                <h3
                  className={`text-lg font-bold ${
                    plan.highlighted
                      ? "text-white"
                      : "text-slate-900 dark:text-white"
                  }`}
                >
                  {plan.name}
                </h3>
                <p
                  className={`mt-1 text-sm ${
                    plan.highlighted ? "text-white/80" : "text-slate-500 dark:text-zinc-400"
                  }`}
                >
                  {plan.tagline}
                </p>
                <div className="mt-5 flex items-end gap-1">
                  <span
                    className={`text-4xl font-bold tracking-tight ${
                      plan.highlighted
                        ? "text-white"
                        : "text-slate-900 dark:text-white"
                    }`}
                  >
                    ${price}
                  </span>
                  <span
                    className={`mb-1 text-sm ${
                      plan.highlighted ? "text-white/70" : "text-slate-500 dark:text-zinc-400"
                    }`}
                  >
                    {price === 0 ? "forever" : `/ mo${yearly ? ", billed yearly" : ""}`}
                  </span>
                </div>
                <Link
                  to={plan.href}
                  className={`mt-6 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all active:scale-[0.98] ${
                    plan.highlighted
                      ? "bg-white text-indigo-600 hover:brightness-95"
                      : "bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 bg-[length:150%_auto] text-white hover:bg-[position:right_center] hover:shadow-card"
                  }`}
                >
                  {plan.cta} <LuArrowRight className="h-4 w-4" />
                </Link>
                <ul className="mt-7 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm">
                      <span
                        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                          plan.highlighted
                            ? "bg-white/25 text-white"
                            : "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300"
                        }`}
                      >
                        <LuCheck className="h-3 w-3" />
                      </span>
                      <span
                        className={
                          plan.highlighted
                            ? "text-white/90"
                            : "text-slate-600 dark:text-zinc-300"
                        }
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 pb-20 sm:px-6">
        <h2 className="text-center text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          Frequently asked questions
        </h2>
        <div className="mt-8 space-y-3">
          {FAQS.map((faq) => (
            <FaqItem key={faq.q} question={faq.q} answer={faq.a} />
          ))}
        </div>
      </section>
    </MarketingLayout>
  );
}

export default PricingPage;
