import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  LuLayoutTemplate,
  LuArrowRight,
  LuSparkles,
  LuCheck,
  LuSearch,
} from "react-icons/lu";
import MarketingLayout from "./MarketingLayout";
import Agent3D from "../core/Agent3D";

type TemplateKind =
  | "hero"
  | "dashboard"
  | "cards"
  | "chat"
  | "pricing"
  | "list"
  | "mobile"
  | "form";

interface Template {
  title: string;
  category: string;
  desc: string;
  kind: TemplateKind;
  accent: string;
  tint: string;
}

const CATEGORIES = [
  "All",
  "Landing",
  "Dashboard",
  "E-commerce",
  "App",
  "Marketing",
];

const TEMPLATES: Template[] = [
  {
    title: "SaaS Landing",
    category: "Landing",
    desc: "Hero, features bento, social proof and CTA band.",
    kind: "hero",
    accent: "from-indigo-500 to-violet-500",
    tint: "bg-indigo-400/60",
  },
  {
    title: "Analytics Dashboard",
    category: "Dashboard",
    desc: "Sidebar, KPI cards and live charts in one view.",
    kind: "dashboard",
    accent: "from-sky-500 to-cyan-500",
    tint: "bg-sky-400/60",
  },
  {
    title: "Product Grid",
    category: "E-commerce",
    desc: "Filterable catalog with prices and add-to-cart.",
    kind: "cards",
    accent: "from-fuchsia-500 to-pink-500",
    tint: "bg-fuchsia-400/60",
  },
  {
    title: "AI Chat App",
    category: "App",
    desc: "Message thread, composer and streaming bubbles.",
    kind: "chat",
    accent: "from-emerald-500 to-teal-500",
    tint: "bg-emerald-400/60",
  },
  {
    title: "Pricing Table",
    category: "Marketing",
    desc: "Three tiers with a highlighted recommended plan.",
    kind: "pricing",
    accent: "from-violet-500 to-purple-500",
    tint: "bg-violet-400/60",
  },
  {
    title: "Blog & Docs",
    category: "Landing",
    desc: "Article list with reading time and tags.",
    kind: "list",
    accent: "from-amber-500 to-orange-500",
    tint: "bg-amber-400/60",
  },
  {
    title: "Mobile Onboarding",
    category: "App",
    desc: "Phone-framed screens with swipe steps.",
    kind: "mobile",
    accent: "from-rose-500 to-red-500",
    tint: "bg-rose-400/60",
  },
  {
    title: "Lead Form",
    category: "Marketing",
    desc: "Multi-field signup with validation states.",
    kind: "form",
    accent: "from-cyan-500 to-blue-500",
    tint: "bg-cyan-400/60",
  },
  {
    title: "Portfolio Grid",
    category: "Landing",
    desc: "Case-study tiles with hover previews.",
    kind: "cards",
    accent: "from-indigo-500 to-blue-500",
    tint: "bg-indigo-400/60",
  },
  {
    title: "Admin Console",
    category: "Dashboard",
    desc: "Data table, bulk actions and detail drawer.",
    kind: "list",
    accent: "from-teal-500 to-emerald-500",
    tint: "bg-teal-400/60",
  },
  {
    title: "Checkout Flow",
    category: "E-commerce",
    desc: "Cart summary, payment fields and order recap.",
    kind: "form",
    accent: "from-purple-500 to-fuchsia-500",
    tint: "bg-purple-400/60",
  },
  {
    title: "Mobile Feed",
    category: "App",
    desc: "Scrollable social feed with story rail.",
    kind: "mobile",
    accent: "from-pink-500 to-rose-500",
    tint: "bg-pink-400/60",
  },
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
      { threshold: 0.08 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [inView]);
  return { ref, inView };
}

// Abstract mini UI preview per template kind — pure CSS, no images.
function TemplateMock({ template }: { template: Template }) {
  const { kind, tint } = template;
  const bar = (w: string) => (
    <div className={`h-1.5 rounded-full ${tint}`} style={{ width: w }} />
  );
  return (
    <div className="relative h-32 overflow-hidden rounded-xl border border-slate-200/70 bg-white p-2.5 dark:border-white/10 dark:bg-zinc-900">
      {kind === "hero" && (
        <div className="flex h-full flex-col justify-center gap-1.5">
          {bar("55%")}
          {bar("80%")}
          {bar("40%")}
          <div className={`mt-1 h-3 w-16 rounded-md bg-gradient-to-r ${template.accent}`} />
        </div>
      )}
      {kind === "dashboard" && (
        <div className="flex h-full gap-2">
          <div className="w-1/4 space-y-1.5">
            {[0, 1, 2, 3].map((i) => bar(i === 0 ? "100%" : "80%"))}
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <div className="grid grid-cols-3 gap-1.5">
              {[0, 1, 2].map((i) => (
                <div key={i} className={`h-4 rounded ${tint} opacity-70`} />
              ))}
            </div>
            <div className="mt-auto flex items-end gap-1">
              {["40%", "70%", "55%", "90%", "65%"].map((h, i) => (
                <div key={i} className={`w-full rounded-t ${tint}`} style={{ height: h }} />
              ))}
            </div>
          </div>
        </div>
      )}
      {kind === "cards" && (
        <div className="grid h-full grid-cols-3 grid-rows-2 gap-1.5">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={`rounded-md ${tint} ${i % 2 ? "opacity-60" : "opacity-90"}`} />
          ))}
        </div>
      )}
      {kind === "chat" && (
        <div className="flex h-full flex-col justify-end gap-1.5">
          <div className={`w-2/3 rounded-lg rounded-bl-sm ${tint} px-2 py-1`} />
          <div className={`ml-auto w-1/2 rounded-lg rounded-br-sm bg-slate-200 dark:bg-zinc-700 px-2 py-1`} />
          <div className={`w-3/4 rounded-lg rounded-bl-sm ${tint} px-2 py-1`} />
          <div className="mt-1 h-3 w-full rounded-md bg-slate-200 dark:bg-zinc-700" />
        </div>
      )}
      {kind === "pricing" && (
        <div className="grid h-full grid-cols-3 gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`flex flex-col gap-1 rounded-lg p-1.5 ${
                i === 1
                  ? `bg-gradient-to-b ${template.accent} text-white`
                  : "bg-slate-100 dark:bg-zinc-800"
              }`}
            >
              <div className={`h-1.5 w-3/4 rounded-full ${i === 1 ? "bg-white/70" : tint}`} />
              <div className={`h-1.5 w-1/2 rounded-full ${i === 1 ? "bg-white/50" : "bg-slate-300 dark:bg-zinc-600"}`} />
            </div>
          ))}
        </div>
      )}
      {kind === "list" && (
        <div className="flex h-full flex-col gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className={`h-3 w-3 rounded ${tint}`} />
              {bar(`${70 - i * 8}%`)}
            </div>
          ))}
        </div>
      )}
      {kind === "mobile" && (
        <div className="flex h-full justify-center">
          <div className="flex h-full w-14 flex-col gap-1 rounded-lg border border-slate-300 p-1 dark:border-zinc-600">
            <div className={`h-2 w-3/4 rounded ${tint}`} />
            <div className="flex-1 rounded bg-slate-100 dark:bg-zinc-800" />
            <div className={`h-1.5 w-full rounded ${tint} opacity-70`} />
          </div>
        </div>
      )}
      {kind === "form" && (
        <div className="flex h-full flex-col justify-center gap-1.5">
          {["60%", "80%", "70%"].map((w, i) => (
            <div key={i} className={`h-3 rounded-md border border-slate-200 dark:border-zinc-700 ${i === 1 ? tint : "bg-slate-50 dark:bg-zinc-800"}`} style={{ width: w }} />
          ))}
          <div className={`mt-0.5 h-3.5 w-20 rounded-md bg-gradient-to-r ${template.accent}`} />
        </div>
      )}
    </div>
  );
}

function TemplateCard({
  template,
  index,
  inView,
}: {
  template: Template;
  index: number;
  inView: boolean;
}) {
  return (
    <div
      className={`hover-ring card-lift group flex flex-col rounded-2xl border border-slate-200/80 bg-white p-4 shadow-soft dark:border-zinc-800 dark:bg-zinc-900/60 ${
        inView ? "rise-in-slow" : "opacity-0"
      }`}
      style={{ animationDelay: `${Math.min(index, 8) * 70}ms` }}
    >
      <TemplateMock template={template} />
      <div className="mt-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
          {template.title}
        </h3>
        <span
          className={`rounded-full bg-gradient-to-r ${template.accent} px-2 py-0.5 text-[10px] font-semibold text-white`}
        >
          {template.category}
        </span>
      </div>
      <p className="mt-1.5 flex-1 text-xs leading-relaxed text-slate-500 dark:text-zinc-400">
        {template.desc}
      </p>
      <Link
        to="/app"
        className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 transition-all group-hover:gap-2.5 dark:text-indigo-300"
      >
        Open in studio <LuArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

function TemplatesPage() {
  const [category, setCategory] = useState("All");
  const { ref, inView } = useInView<HTMLDivElement>();

  const filtered = useMemo(
    () =>
      category === "All"
        ? TEMPLATES
        : TEMPLATES.filter((template) => template.category === category),
    [category]
  );

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
        <div className="relative mx-auto max-w-6xl px-4 pb-12 pt-16 text-center sm:px-6 lg:pt-20">
          <div className="pop-in mx-auto flex w-fit justify-center">
            <Agent3D variant="avatar" mood="idle" />
          </div>
          <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-indigo-200/70 bg-white/70 px-3 py-1 text-xs font-medium text-indigo-600 backdrop-blur dark:border-indigo-400/30 dark:bg-indigo-400/10 dark:text-indigo-300">
            <LuLayoutTemplate className="h-3.5 w-3.5" /> {TEMPLATES.length} starting points
          </span>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
            Pick a{" "}
            <span className="animated-brand-gradient">template</span>, make it yours
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600 dark:text-zinc-300">
            Launch from a proven layout, then let the agent restyle it to match
            your brand. Every template is a real, editable React / Tailwind /
            HTML starting point.
          </p>
        </div>
      </section>

      {/* Gallery */}
      <section ref={ref} className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        {/* Category filter */}
        <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
          {CATEGORIES.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                category === item
                  ? "bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 text-white shadow-soft"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:text-indigo-600 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300 dark:hover:border-indigo-400/40"
              }`}
            >
              {category === item && <LuCheck className="h-3.5 w-3.5" />}
              {item}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((template, index) => (
            <TemplateCard
              key={`${category}-${template.title}`}
              template={template}
              index={index}
              inView={inView}
            />
          ))}
        </div>
      </section>

      {/* CTA band */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="brand-backdrop relative overflow-hidden rounded-3xl border border-white/60 px-8 py-12 text-center shadow-card dark:border-white/10 sm:px-16">
          <div aria-hidden="true" className="dot-grid absolute inset-0 opacity-40" />
          <div className="relative mx-auto max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200/70 bg-white/70 px-3 py-1 text-xs font-medium text-indigo-600 dark:border-indigo-400/30 dark:bg-indigo-400/10 dark:text-indigo-300">
              <LuSparkles className="h-3.5 w-3.5" /> Don&apos;t see your idea?
            </span>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              Describe it and the agent builds it
            </h2>
            <p className="mt-2 text-slate-600 dark:text-zinc-300">
              Templates are just the shortcut — paste a screenshot or write a
              prompt to start from anything.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                to="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 bg-[length:150%_auto] px-6 py-3 text-sm font-semibold text-white shadow-soft transition-all hover:bg-[position:right_center] hover:shadow-card active:scale-[0.98]"
              >
                Start free <LuArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/app"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white/70 px-6 py-3 text-sm font-semibold text-slate-800 transition-colors hover:bg-white dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-100 dark:hover:bg-zinc-900"
              >
                <LuSearch className="h-4 w-4" /> Browse in studio
              </Link>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}

export default TemplatesPage;
