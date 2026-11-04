"""The built-in ScreGPT signature design system content.

Ships with the backend, is seeded into the user's design-system store on first
startup (see routes/design_systems.py), and can be selected/edited like any
other design system. Its content is a full token system (color, type, space,
radius, elevation, motion) plus hard component and quality rules, injected into
generation prompts when selected.
"""

BUILTIN_DESIGN_SYSTEM_ID = "builtin-signature"

BUILTIN_DESIGN_SYSTEM_NAME = "ScreGPT Signature (built-in)"

BUILTIN_DESIGN_SYSTEM_CONTENT = """\
# ScreGPT Signature Design System

You must apply this design system to every page you generate. When it conflicts
with other styling instructions, this system wins. Output code that follows it
exactly.

## 1. Core principles
- Design magazine-grade, product-shippable interfaces, not wireframes.
- One visual idea per section; generous whitespace; strict alignment to a 12-column grid.
- Every page gets a clear focal point: exactly one primary call-to-action above the fold.
- Prefer restraint and rhythm over decoration; polish lives in the details (states, spacing, optical alignment).

## 2. Color tokens
Declare these CSS custom properties on :root and use them for ALL color decisions
(in Tailwind, map them to arbitrary values like bg-[var(--surface-primary)] or extend the
theme config). Never invent one-off hex colors.

- --bg: #F7F7F5 (light) / #0B0D12 (dark)
- --surface-primary: #FFFFFF / #11141B
- --surface-secondary: #F1F1EE / #171B24
- --surface-inverse: #14161A / #EDEEF2
- --text-primary: #16181D / #F2F3F7
- --text-secondary: #4E5561 / #A6AEBF
- --text-tertiary: #8A919F / #6B7385
- --border-subtle: #E4E4E0 / #1F2430
- --border-strong: #C9C9C4 / #313848
- --brand-600: #4F46E5, --brand-500: #6366F1, --brand-300: #A5B4FC, --brand-100: #E0E7FF
- --accent: #D946EF (used only for highlights, active states and emphasis — never for large surfaces)
- --success: #10B981, --warning: #F59E0B, --danger: #E11D48

Rules:
- Build each page from one brand hue, one accent, and the neutrals. Max 4 saturated colors per page.
- Tint shadows with the page background hue (never pure black); never use pure #000 or pure #FFF for surfaces.
- Body text on --bg must meet AA contrast (≥4.5:1); large text ≥3:1.

## 3. Typography
- Display/headings: "Fraunces" or "Space Grotesk" (Google Fonts). Body & UI: "Inter". Mono: "JetBrains Mono".
- Major-third scale (rem): 4.0 / 3.0 / 2.25 / 1.6875 / 1.375 / 1.125 / 1.0 / 0.875 / 0.75.
- Weights: 400 body, 500 UI labels, 600–700 headings only. Never more than three weights on a page.
- Line-height: 1.1 headings, 1.2 subheads, 1.6 body, 1.5 UI labels.
- Letter-spacing: -0.02em at ≥1.6875rem, -0.01em at 1.125–1.6rem, 0.06em uppercase for section labels/eyebrows.
- Paragraphs capped at 68ch measure; body min 16px always.

## 4. Spacing & layout
- 4pt rhythm. Scale (px): 4, 8, 12, 16, 24, 32, 48, 64, 96, 128. No other spacing values.
- Content container: max-width 1200px, side padding 24px (mobile) / 32px (tablet) / 48px (desktop).
- Section vertical rhythm: 96–128px desktop, 64px mobile. Related items within a section use 16–24px gaps.
- Cards live on a 12-col grid with 24px gutters; dense layouts use 16px.

## 5. Radius, borders & elevation
- Radius scale (px): 4, 8, 12, 16, 24, 9999. Buttons & inputs = 8–12; cards = 16; feature panels = 24; pills = 9999. One family per component type.
- Borders: 1px. --border-subtle for dividers, --border-strong for interactive outlines.
- Elevation (dual-layer shadows):
  - --shadow-sm: 0 1px 2px rgba(20,22,26,.06), 0 1px 3px rgba(20,22,26,.08)
  - --shadow-md: 0 4px 8px -2px rgba(20,22,26,.08), 0 12px 24px -4px rgba(20,22,26,.10)
  - --shadow-lg: 0 8px 16px -4px rgba(20,22,26,.10), 0 24px 48px -8px rgba(20,22,26,.14)
- Dark mode shadows: same geometry, alpha ×1.5.

## 6. Components
- Buttons: primary = solid --brand-600, white label, weight 600; secondary = surface-secondary with --border-strong; ghost = transparent text only. States: hover lifts one elevation step + 2% darker; active = translateY(1px); focus-visible = 2px --brand-500 ring with 2px offset; disabled = 40% opacity, no-underline, cursor-not-allowed. Heights: sm 32px, md 40px, lg 48px; horizontal padding = 1.5× the body size (16px at md).
- Inputs: 40px height, --surface-primary bg, 1px --border-strong; focus = 1px --brand-600 border + 2px --brand-100 ring. Errors: --danger border + 12px message below with 8px icon.
- Cards: --surface-primary, 1px --border-subtle, --shadow-sm → --shadow-md on hover (translateY(-2px), 200ms). Internal padding 24px. Header/body/footer separated by 16–24px.
- Navigation: sticky 64px bar, --bg at 80% opacity + backdrop-blur(12px), bottom 1px --border-subtle; active item gets a 2px --brand-600 underline flush to the bar edge.
- Section headers: uppercase 12px eyebrow in --brand-600 with 0.06em tracking, 8px gap, heading, then a ≤65ch description in --text-secondary.
- Images: cover-fit, 12–16px radius, subtle 1px --border-subtle; device/browser screenshots framed in a mock chrome bar.
- Icons: single line-icon family (e.g. Lucide), 24px grid at 1.5px stroke, sized in steps of 4; always paired with a label in the UI.

## 7. Motion
- Durations: micro-states 150ms, transitions 200ms, entrances 300ms.
- Easing: ease-out (entering), ease-in (exiting), no linear except spin loaders.
- Page entrances: fade-in plus 8px rise, 60–80ms stagger between siblings.
- Respect prefers-reduced-motion: disable transforms and stagger, keep color transitions.

## 8. Dark mode
- Derived, not inverted: swap the token pairs above; raise elevation with lighter surfaces, not shadows.
- Desaturate the brand hue ~10% in dark; --accent usage stays identical.

## 9. Content voice
- Real, specific copy — never lorem ipsum. Active voice, sentence case, ≤12-word headings.
- Numbers with thin space or comma separators; prices styled as $1,299.
- Every section earns its place: no filler stats or fake logos unless the request asks.

## 10. Hard prohibitions
- No emoji as icons. No default system-font-only pages. No pure black/white surfaces.
- No identical centered hero+button layout on every page; vary composition (split, asymmetric, editorial).
- No horizontal scroll at any breakpoint; no text contrast below AA.
"""
