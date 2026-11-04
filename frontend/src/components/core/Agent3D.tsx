export type AgentMood = "idle" | "working" | "success" | "error";

interface Agent3DProps {
  // "full" is the large animated hero robot; "avatar" is the compact chat token.
  variant?: "full" | "avatar";
  // Legacy convenience: when true and no explicit mood is set, the agent works.
  working?: boolean;
  // The agent's emotional state. Drives glow color, facial expression, and the
  // one-shot celebration (success) / shake (error) reactions.
  mood?: AgentMood;
  className?: string;
}

// Per-mood Tailwind fragments. `body`/`glow` recolor the shell and ambient
// light, `oneShot` replays once on every mood transition, and `aria` labels
// the state for screen readers.
const MOOD_STYLES: Record<
  AgentMood,
  {
    body: string;
    glow: string;
    antenna: string;
    orbit: string;
    oneShot: string;
    aria: string;
  }
> = {
  idle: {
    body: "from-indigo-500 via-violet-500 to-fuchsia-500",
    glow: "from-indigo-500/50 via-violet-500/50 to-fuchsia-500/50",
    antenna: "from-fuchsia-400 to-indigo-400",
    orbit: "border-indigo-400/70",
    oneShot: "",
    aria: "idle",
  },
  working: {
    body: "from-indigo-500 via-violet-500 to-fuchsia-500",
    glow: "from-indigo-500/50 via-violet-500/50 to-fuchsia-500/50",
    antenna: "from-fuchsia-400 to-indigo-400",
    orbit: "border-indigo-400/70",
    oneShot: "",
    aria: "working",
  },
  success: {
    body: "from-emerald-500 via-teal-500 to-cyan-500",
    glow: "from-emerald-500/55 via-teal-500/55 to-cyan-500/55",
    antenna: "from-emerald-300 to-teal-500",
    orbit: "border-emerald-400/70",
    oneShot: "agent-celebrate",
    aria: "finished successfully",
  },
  error: {
    body: "from-rose-500 via-red-500 to-orange-500",
    glow: "from-rose-500/55 via-red-500/55 to-orange-500/55",
    antenna: "from-rose-300 to-red-500",
    orbit: "border-rose-400/70",
    oneShot: "agent-shake",
    aria: "encountered an error",
  },
};

function resolveMood(mood?: AgentMood, working?: boolean): AgentMood {
  if (mood) return mood;
  return working ? "working" : "idle";
}

// Face screen contents switch with the mood: glowing eyes while thinking/
// working, happy arcs on success, slanted brows on error.
function AgentFace({ mood }: { mood: AgentMood }) {
  if (mood === "success") {
    return (
      <div className="flex items-center justify-center gap-3">
        {/* Happy closed eyes (upward arcs) */}
        <span className="h-3 w-4 rounded-t-full border-[2.5px] border-b-0 border-white" />
        <span className="h-3 w-4 rounded-t-full border-[2.5px] border-b-0 border-white" />
      </div>
    );
  }
  if (mood === "error") {
    return (
      <div className="flex items-center justify-center gap-3">
        {/* Worried slanted brows */}
        <span className="h-[2.5px] w-4 -rotate-12 rounded-full bg-white" />
        <span className="h-[2.5px] w-4 rotate-12 rounded-full bg-white" />
      </div>
    );
  }
  // idle / working: glowing, blinking eyes
  return (
    <div className="agent-look flex items-center justify-center gap-3">
      <span className="agent-eye h-3.5 w-3.5 rounded-full bg-gradient-to-b from-white to-indigo-100 shadow-[0_0_8px_rgba(255,255,255,0.7)]" />
      <span
        className="agent-eye h-3.5 w-3.5 rounded-full bg-gradient-to-b from-white to-fuchsia-100 shadow-[0_0_8px_rgba(255,255,255,0.7)]"
        style={{ animationDelay: "0.2s" }}
      />
    </div>
  );
}

// Mouth / status light, rendered inside the dark face screen for contrast.
function AgentMouth({ mood }: { mood: AgentMood }) {
  if (mood === "success") {
    // Broad smile
    return (
      <div className="h-3 w-8 rounded-b-full border-b-[2.5px] border-white/90" />
    );
  }
  if (mood === "error") {
    // Flat, tense mouth line
    return <div className="h-1.5 w-5 rounded-full bg-white/80" />;
  }
  if (mood === "working") {
    // Talking equalizer bars
    return (
      <div className="flex h-1.5 items-end gap-[3px]">
        <span className="agent-mouth-bar h-full w-1.5 rounded-full bg-white/90" />
        <span
          className="agent-mouth-bar h-full w-1.5 rounded-full bg-white/90"
          style={{ animationDelay: "0.15s" }}
        />
        <span
          className="agent-mouth-bar h-full w-1.5 rounded-full bg-white/90"
          style={{ animationDelay: "0.3s" }}
        />
      </div>
    );
  }
  // idle: calm, centered bar
  return <div className="h-1.5 w-7 rounded-full bg-white/80" />;
}

// Compact, glossy 3D token anchored to the assistant side of the chat thread.
function AgentAvatar({ mood }: { mood: AgentMood }) {
  const style = MOOD_STYLES[mood];
  const working = mood === "working";
  return (
    <div
      className={`relative flex h-8 w-8 shrink-0 items-center justify-center ${
        working ? "agent-working" : ""
      }`}
    >
      {/* Conic halo that spins around the token (brightest while working) */}
      <span
        aria-hidden="true"
        className="agent-halo absolute -inset-1 rounded-full opacity-70 blur-[2px]"
        style={{
          WebkitMaskImage:
            "radial-gradient(closest-side, transparent 72%, black 76%)",
          maskImage: "radial-gradient(closest-side, transparent 72%, black 76%)",
        }}
      />
      {/* Orbiting ring for depth */}
      <span
        aria-hidden="true"
        className="agent-orbit absolute inset-0 rounded-full border-2 border-indigo-300/40 dark:border-indigo-400/30"
        style={{ borderTopColor: "transparent", borderBottomColor: "transparent" }}
      />
      {/* Breathing glow halo, tinted by mood */}
      <span
        aria-hidden="true"
        className={`agent-glow absolute inset-0 rounded-full bg-gradient-to-br blur-md ${style.glow}`}
      />
      {/* Spherical body — keyed by mood so the one-shot reaction replays */}
      <div
        key={mood}
        className={`agent-bob ${style.oneShot} relative flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br ${style.body} shadow-soft ring-1 ring-white/50`}
      >
        {/* Top gloss */}
        <span
          aria-hidden="true"
          className="absolute inset-[3px] rounded-full"
          style={{
            background:
              "radial-gradient(circle at 30% 22%, rgba(255,255,255,0.6), transparent 62%)",
          }}
        />
        {/* Eyes (recolor for success/error for a hint of expression) */}
        {mood === "success" ? (
          <div className="relative flex gap-[2px]">
            <span className="h-[3px] w-[4px] rounded-t-full border-t border-white" />
            <span className="h-[3px] w-[4px] rounded-t-full border-t border-white" />
          </div>
        ) : mood === "error" ? (
          <div className="relative flex gap-[3px]">
            <span className="h-[2px] w-[4px] -rotate-12 rounded-full bg-white" />
            <span className="h-[2px] w-[4px] rotate-12 rounded-full bg-white" />
          </div>
        ) : (
          <div className="agent-look relative flex gap-[3px]">
            <span className="agent-eye h-[3px] w-[3px] rounded-full bg-white" />
            <span
              className="agent-eye h-[3px] w-[3px] rounded-full bg-white"
              style={{ animationDelay: "0.18s" }}
            />
          </div>
        )}
      </div>
      {/* Live progress bubble that appears while the agent works */}
      {working && (
        <span
          aria-hidden="true"
          className="agent-thinking-dots absolute -right-1.5 -top-1.5 flex items-center gap-[2px] rounded-full rounded-bl-none border border-indigo-200/70 bg-white px-1 py-[2px] shadow-soft dark:border-indigo-500/30 dark:bg-zinc-900"
        >
          <span className="agent-dot h-1 w-1 rounded-full bg-indigo-500" />
          <span
            className="agent-dot h-1 w-1 rounded-full bg-violet-500"
            style={{ animationDelay: "0.15s" }}
          />
          <span
            className="agent-dot h-1 w-1 rounded-full bg-fuchsia-500"
            style={{ animationDelay: "0.3s" }}
          />
        </span>
      )}
    </div>
  );
}

// Large floating 3D robot used as the loading/hero centerpiece.
function AgentFull({ mood }: { mood: AgentMood }) {
  const style = MOOD_STYLES[mood];
  const working = mood === "working";
  return (
    <div
      className={`perspective-600 relative flex h-40 w-40 items-center justify-center ${
        working ? "agent-working" : ""
      }`}
    >
      {/* Ambient glow, tinted by mood */}
      <span
        aria-hidden="true"
        className={`agent-glow absolute h-32 w-32 rounded-full bg-gradient-to-br ${style.glow} blur-2xl`}
      />
      {/* Rotating conic aura ring for a premium halo */}
      <span
        aria-hidden="true"
        className="agent-aura absolute h-40 w-40 rounded-full opacity-70"
        style={{
          WebkitMaskImage:
            "radial-gradient(closest-side, transparent 62%, black 66%)",
          maskImage: "radial-gradient(closest-side, transparent 62%, black 66%)",
        }}
      />
      {/* Twinkling sparkles orbiting the composition */}
      <span aria-hidden="true" className="agent-sparkle absolute left-2 top-6 h-1.5 w-1.5 rounded-full bg-indigo-300 shadow-[0_0_8px_rgba(129,140,248,0.9)]" />
      <span aria-hidden="true" className="agent-sparkle agent-sparkle-2 absolute right-3 top-10 h-1 w-1 rounded-full bg-fuchsia-300 shadow-[0_0_8px_rgba(232,121,249,0.9)]" />
      <span aria-hidden="true" className="agent-sparkle agent-sparkle-3 absolute bottom-8 left-6 h-1 w-1 rounded-full bg-violet-200 shadow-[0_0_8px_rgba(196,181,253,0.9)]" />

      {/* Orbiting rings, tilted in 3D */}
      <span
        aria-hidden="true"
        className={`agent-orbit absolute h-36 w-36 rounded-full border ${style.orbit}`}
        style={{ borderTopColor: "transparent", borderBottomColor: "transparent" }}
      />
      <span
        aria-hidden="true"
        className="agent-orbit-rev absolute h-28 w-28 rounded-full border border-fuchsia-400/70"
        style={{ borderLeftColor: "transparent", borderRightColor: "transparent" }}
      />
      {/* Particles riding the orbit rings */}
      <span
        aria-hidden="true"
        className="agent-particle absolute h-36 w-36"
        style={{ transform: "rotateX(72deg)" }}
      >
        <span className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-indigo-400 shadow-[0_0_6px_rgba(129,140,248,0.9)]" />
      </span>
      <span
        aria-hidden="true"
        className="agent-particle-rev absolute h-28 w-28"
        style={{ transform: "rotateX(72deg)" }}
      >
        <span className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-fuchsia-400 shadow-[0_0_6px_rgba(232,121,249,0.9)]" />
      </span>

      {/* Grounding shadow under the floating body (squishes with the float) */}
      <span
        aria-hidden="true"
        className="agent-ground-shadow absolute bottom-1 h-3 w-24 rounded-[100%] bg-slate-900/25 blur-md dark:bg-black/50"
      />

      {/* Body (floats + tilts as one rigid 3D piece) */}
      <div className="agent-float preserve-3d relative flex h-28 w-28 flex-col items-center">
        {/* Reaction layer keyed by mood replays the celebrate/shake once */}
        <div
          key={mood}
          className={`relative flex h-full w-full flex-col items-center ${style.oneShot}`}
        >
          {/* Specular highlight on the shell */}
          <span
            aria-hidden="true"
            className="absolute left-5 top-4 h-3 w-6 -rotate-12 rounded-full bg-white/60 blur-[2px]"
          />
          {/* Antenna */}
          <span
            aria-hidden="true"
            className={`agent-antenna absolute -top-4 h-4 w-0.5 rounded-full bg-gradient-to-b ${style.antenna}`}
          />
          <span
            aria-hidden="true"
            className={`agent-antenna absolute -top-5 h-2 w-2 rounded-full bg-gradient-to-br ${style.body}`}
          />

          {/* Head */}
          <div
            className={`relative flex h-full w-full flex-col items-center justify-center rounded-[1.9rem] border border-white/40 bg-gradient-to-br ${style.body} shadow-card`}
          >
            {/* Side ear pods for a more physical shell */}
            <span
              aria-hidden="true"
              className="absolute -left-1.5 top-1/2 h-7 w-2.5 -translate-y-1/2 rounded-l-full bg-gradient-to-b from-indigo-300 to-violet-400 shadow-inner"
            />
            <span
              aria-hidden="true"
              className="absolute -right-1.5 top-1/2 h-7 w-2.5 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-violet-400 to-fuchsia-400 shadow-inner"
            />
            {/* Forehead status LED */}
            <span
              aria-hidden="true"
              className={`agent-led absolute left-1/2 top-2.5 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-white/90 shadow-[0_0_6px_rgba(255,255,255,0.9)]`}
            />
            {/* Cheek accent lights flanking the face screen */}
            <span
              aria-hidden="true"
              className="absolute left-2 top-1/2 h-1 w-1 -translate-y-1/2 rounded-full bg-cyan-200/80 shadow-[0_0_5px_rgba(103,232,249,0.9)]"
            />
            <span
              aria-hidden="true"
              className="absolute right-2 top-1/2 h-1 w-1 -translate-y-1/2 rounded-full bg-fuchsia-200/80 shadow-[0_0_5px_rgba(240,171,252,0.9)]"
            />
            {/* Face screen (dark panel) holds the eyes and mouth together */}
            <div className="relative flex h-16 w-20 flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl bg-slate-900/85 shadow-inner ring-1 ring-white/10">
              {/* Soft scanline glow at the top of the screen */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-5 bg-gradient-to-b from-indigo-400/25 to-transparent"
              />
              {/* Faint LCD pixel grid for a premium display texture */}
              <span
                aria-hidden="true"
                className="agent-lcd-grid pointer-events-none absolute inset-0 opacity-40"
              />
              {/* Moving scan beam while working */}
              {working && (
                <span
                  aria-hidden="true"
                  className="agent-scan pointer-events-none absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-white/0 via-white/15 to-white/0"
                />
              )}
              {/* Eye shine sweep */}
              <span
                aria-hidden="true"
                className="sheen pointer-events-none absolute inset-0 rounded-2xl opacity-70"
              />
              {/* Expression */}
              <AgentFace mood={mood} />
              {/* Mouth / status light (on the dark screen) */}
              <AgentMouth mood={mood} />
            </div>
            {/* Glossy top highlight */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-4 top-2 h-6 rounded-full bg-white/25 blur-md"
            />
            {/* Bottom rim light for extra depth */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-6 bottom-1.5 h-3 rounded-full bg-white/20 blur-md"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// A pure-CSS 3D animated agent. No external 3D libs — keeps the bundle light
// while giving the assistant a physical, floating "body" across the product.
export default function Agent3D({
  variant = "avatar",
  working = false,
  mood,
  className,
}: Agent3DProps) {
  const resolvedMood = resolveMood(mood, working);
  return (
    <div
      className={className}
      role="img"
      aria-label={`ScreGPT agent — ${MOOD_STYLES[resolvedMood].aria}`}
    >
      {variant === "full" ? (
        <AgentFull mood={resolvedMood} />
      ) : (
        <AgentAvatar mood={resolvedMood} />
      )}
    </div>
  );
}
