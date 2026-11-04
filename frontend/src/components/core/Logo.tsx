interface LogoProps {
  className?: string;
  showWordmark?: boolean;
  size?: "sm" | "md" | "lg";
}

const SIZE_MAP = {
  sm: { tile: "h-7 w-7", text: "text-base" },
  md: { tile: "h-9 w-9", text: "text-lg" },
  lg: { tile: "h-12 w-12", text: "text-2xl" },
} as const;

// Brand mark for ScreGPT: a rounded gradient tile that fuses a "screenshot"
// frame with a code glyph (`</>`) plus an AI spark, followed by the wordmark.
function Logo({ className = "", showWordmark = true, size = "md" }: LogoProps) {
  const dims = SIZE_MAP[size];
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        viewBox="0 0 40 40"
        className={`${dims.tile} shrink-0 drop-shadow-[0_4px_10px_rgba(99,102,241,0.35)]`}
        role="img"
        aria-label="ScreGPT logo"
      >
        <defs>
          <linearGradient id="screngpt-tile" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="52%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#d946ef" />
          </linearGradient>
          <linearGradient id="screngpt-gloss" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
            <stop offset="45%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Gradient tile */}
        <rect x="1" y="1" width="38" height="38" rx="11" fill="url(#screngpt-tile)" />
        {/* Top gloss for depth */}
        <rect x="1" y="1" width="38" height="38" rx="11" fill="url(#screngpt-gloss)" />

        {/* Screenshot / browser frame hint */}
        <rect
          x="8.5"
          y="11"
          width="23"
          height="18"
          rx="3.2"
          fill="none"
          stroke="white"
          strokeOpacity="0.55"
          strokeWidth="1.4"
        />
        <line
          x1="8.5"
          y1="15.5"
          x2="31.5"
          y2="15.5"
          stroke="white"
          strokeOpacity="0.5"
          strokeWidth="1.2"
        />
        <circle cx="11.4" cy="13.2" r="0.9" fill="white" fillOpacity="0.8" />
        <circle cx="14.2" cy="13.2" r="0.9" fill="white" fillOpacity="0.6" />

        {/* Code glyph */}
        <path
          d="M16.5 20 13.8 23.5 16.5 27"
          stroke="white"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M24.5 20 27.2 23.5 24.5 27"
          stroke="white"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M22 19.2 19 27.8"
          stroke="white"
          strokeWidth="2.1"
          strokeLinecap="round"
          fill="none"
        />

        {/* AI spark */}
        <path
          d="M31 8.2 31.9 10.4 34.1 11.3 31.9 12.2 31 14.4 30.1 12.2 27.9 11.3 30.1 10.4 Z"
          fill="#fde68a"
        />
      </svg>
      {showWordmark && (
        <span
          className={`select-none font-semibold tracking-tight text-slate-900 dark:text-white ${dims.text}`}
        >
          Scre
          <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
            GPT
          </span>
        </span>
      )}
    </span>
  );
}

export default Logo;
