import { FormEvent, useMemo, useState } from "react";
import {
  LuUser,
  LuMail,
  LuTag,
  LuMessageSquare,
  LuSend,
  LuCheck,
  LuGithub,
  LuBug,
  LuSparkles,
} from "react-icons/lu";
import toast from "react-hot-toast";
import MarketingLayout, { REPO_URL } from "./MarketingLayout";
import { useAuth } from "../../store/auth-context";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";

// Placeholder support inbox — swap for your own when you wire up a real address.
const SUPPORT_EMAIL = "support@screngpt.app";

const TOPICS = ["Feedback", "Bug report", "Feature request", "Question", "Other"];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FormErrors {
  name?: string;
  email?: string;
  message?: string;
}

const CHANNELS = [
  {
    icon: LuBug,
    title: "Report an issue",
    desc: "Found a bug? Open a GitHub issue with steps to reproduce it.",
    href: `${REPO_URL}/issues/new`,
    cta: "New issue",
  },
  {
    icon: LuGithub,
    title: "Source & discussions",
    desc: "Browse the code, star the repo and join community discussions.",
    href: REPO_URL,
    cta: "Open GitHub",
  },
  {
    icon: LuSparkles,
    title: "Ideas & feedback",
    desc: "Have a feature idea? The contact form is the fastest way to send it.",
    href: null,
    cta: null,
  },
];

function ContactPage() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [topic, setTopic] = useState(TOPICS[0]);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  const remaining = useMemo(() => Math.max(0, 1200 - message.length), [message]);

  const validate = (): FormErrors => {
    const next: FormErrors = {};
    if (!name.trim()) next.name = "Please tell us your name.";
    if (!EMAIL_PATTERN.test(email.trim())) next.email = "Enter a valid email address.";
    if (message.trim().length < 10) next.message = "Message should be at least 10 characters.";
    return next;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast.error("Please fix the highlighted fields.");
      return;
    }

    const subject = `[ScreGPT · ${topic}] from ${name.trim()}`;
    const body = `Name: ${name.trim()}\nEmail: ${email.trim()}\nTopic: ${topic}\n\n${message.trim()}`;
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;

    setSubmitted(true);
    toast.success("Thanks! Your message is ready to send.");
  };

  const resetForm = () => {
    setName(user?.name ?? "");
    setEmail(user?.email ?? "");
    setTopic(TOPICS[0]);
    setMessage("");
    setErrors({});
    setSubmitted(false);
  };

  const fieldBase =
    "w-full rounded-xl border bg-white pl-9 pr-3 py-2.5 text-sm text-slate-900 shadow-soft transition-all placeholder:text-slate-400 focus:outline-none dark:bg-zinc-900 dark:text-zinc-100";
  const okRing =
    "border-slate-200 focus:border-indigo-400 focus:shadow-[0_0_0_4px_rgba(99,102,241,0.12)] dark:border-zinc-700 dark:focus:border-indigo-500";
  const badRing =
    "border-rose-300 focus:border-rose-400 focus:shadow-[0_0_0_4px_rgba(244,63,94,0.12)] dark:border-rose-500/60";

  return (
    <MarketingLayout>
      {/* Intro */}
      <section className="brand-backdrop relative overflow-hidden">
        <div aria-hidden="true" className="dot-grid absolute inset-0 opacity-50" />
        <div
          aria-hidden="true"
          className="orb-float pointer-events-none absolute -right-10 top-0 h-64 w-64 rounded-full bg-fuchsia-400/30 blur-3xl dark:bg-fuchsia-500/20"
        />
        <div className="relative mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200/70 bg-white/60 px-3 py-1 text-xs font-medium text-indigo-600 backdrop-blur dark:border-indigo-400/30 dark:bg-indigo-400/10 dark:text-indigo-300">
            Contact
          </span>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
            Let&apos;s talk
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-600 dark:text-zinc-300">
            Questions, feedback or a stubborn screenshot you want us to see —
            drop us a line and we&apos;ll get back to you.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
          {/* Form */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card dark:border-zinc-800 dark:bg-zinc-900/60 sm:p-8">
              {submitted ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
                    <LuCheck className="h-7 w-7" />
                  </span>
                  <h2 className="mt-4 text-xl font-semibold text-slate-900 dark:text-white">
                    Message ready to go
                  </h2>
                  <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-zinc-400">
                    We opened your email app with everything filled in. Just hit
                    send — or write to us at{" "}
                    <a
                      href={`mailto:${SUPPORT_EMAIL}`}
                      className="font-medium text-indigo-600 hover:underline dark:text-indigo-300"
                    >
                      {SUPPORT_EMAIL}
                    </a>
                    .
                  </p>
                  <button
                    onClick={resetForm}
                    className="mt-6 rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="name">Name</Label>
                      <div className="relative">
                        <LuUser className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                          id="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Ada Lovelace"
                          className={`${fieldBase} pl-9 ${errors.name ? badRing : okRing}`}
                        />
                      </div>
                      {errors.name && (
                        <p className="text-xs text-rose-500">{errors.name}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <LuMail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          className={`${fieldBase} pl-9 ${errors.email ? badRing : okRing}`}
                        />
                      </div>
                      {errors.email && (
                        <p className="text-xs text-rose-500">{errors.email}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="topic">Topic</Label>
                    <div className="relative">
                      <LuTag className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <select
                        id="topic"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        className={`${fieldBase} ${okRing} cursor-pointer`}
                      >
                        {TOPICS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="message">Message</Label>
                      <span
                        className={`text-xs tabular-nums ${
                          remaining < 100 ? "text-amber-500" : "text-slate-400"
                        }`}
                      >
                        {message.length}/1200
                      </span>
                    </div>
                    <div className="relative">
                      <LuMessageSquare className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Textarea
                        id="message"
                        value={message}
                        maxLength={1200}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Tell us what's on your mind…"
                        className={`${fieldBase} pl-9 min-h-[130px] resize-y ${
                          errors.message ? badRing : okRing
                        }`}
                      />
                    </div>
                    {errors.message && (
                      <p className="text-xs text-rose-500">{errors.message}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="group inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 text-sm font-semibold text-white shadow-soft transition-all hover:shadow-card hover:brightness-110 active:scale-[0.99]"
                  >
                    <LuSend className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    Send message
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Channels */}
          <aside className="lg:col-span-2">
            <div className="space-y-4">
              {CHANNELS.map((channel) => {
                const inner = (
                  <>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
                      <channel.icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                        {channel.title}
                      </h3>
                      <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-zinc-400">
                        {channel.desc}
                      </p>
                      {channel.cta && (
                        <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-300">
                          {channel.cta}
                        </span>
                      )}
                    </div>
                  </>
                );

                const cardClass =
                  "flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft transition-all dark:border-zinc-800 dark:bg-zinc-900/60";

                return channel.href ? (
                  <a
                    key={channel.title}
                    href={channel.href}
                    target="_blank"
                    rel="noreferrer"
                    className={`${cardClass} hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-card dark:hover:border-indigo-700`}
                  >
                    {inner}
                  </a>
                ) : (
                  <div key={channel.title} className={cardClass}>
                    {inner}
                  </div>
                );
              })}

              <div className="brand-backdrop relative overflow-hidden rounded-2xl border border-white/60 p-5 shadow-soft dark:border-white/10">
                <p className="text-xs text-slate-600 dark:text-zinc-300">
                  Prefer the app? Reach us right inside the studio — the agent
                  logs every run so support can help faster.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </MarketingLayout>
  );
}

export default ContactPage;
