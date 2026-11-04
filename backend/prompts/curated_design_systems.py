"""Curated, ready-to-use design systems shipped with the backend.

Each entry is a distinct visual language with its own palette, typography and
component rules. They are seeded into the user's design-system store on startup
alongside the built-in ScreGPT Signature (see routes/design_systems.py) and can
be selected or edited like any other system. When a system is selected its
content is injected into generation prompts, so each one is written as an
imperative, token-first brief that produces a clearly different look.

Shape: (id, name, content).
"""

CURATED_DESIGN_SYSTEMS: list[tuple[str, str, str]] = [
    (
        "builtin-midnight-neon",
        "Midnight Neon (built-in)",
        """\
# Midnight Neon Design System

Apply this system to every page. It wins over conflicting styling instructions.
A dark, high-energy interface for fintech, crypto, AI and developer tools.

## Core principles
- Near-black canvas with electric neon accents; dramatic, technical, confident.
- Depth from glow and layered dark surfaces, not light shadows.
- One focal accent per section; restraint keeps the neon readable.

## Color tokens (declare on :root, use everywhere)
- --bg: #06070D; --surface-1: #0C0E18; --surface-2: #141726; --surface-3: #1D2136
- --border: #262B45; --border-bright: #384066
- --text: #F4F6FF; --text-muted: #AAB2D0; --text-faint: #6B74A0
- --neon-violet: #7C5CFF; --neon-cyan: #22D3EE; --neon-pink: #F472B6; --neon-lime: #A3E635
- --brand: var(--neon-violet); --success: #34D399; --danger: #FB7185
Rules: text is always light on dark. Neon is for accents, borders, glows and
data-viz — never for large text bodies. Keep ≥4.5:1 text contrast.

## Typography
- Display/headings: "Space Grotesk" or "Sora". Body/UI: "Inter". Mono: "JetBrains Mono".
- Scale (rem): 4.5 / 3.2 / 2.4 / 1.8 / 1.35 / 1.05 / 0.85. Headings 600–700, body 400.
- Eyebrow labels: 0.78rem, uppercase, 0.14em tracking, in --neon-cyan.

## Spacing, radius, elevation
- 4pt scale: 4,8,12,16,24,32,48,64,96,128. Container max 1200px, padding 24/48px.
- Radius: buttons/inputs 10, cards 16, panels 20, pills 9999.
- Glow elevation: 0 0 0 1px border + 0 8px 40px -12px color-mix(accent 55%).

## Components
- Buttons: primary = violet→cyan gradient fill, white label, glow on hover (lift +
  stronger glow); ghost = transparent with --border, hover brightens border to accent.
  focus-visible = 2px accent ring + 2px offset.
- Cards: --surface-1, 1px --border, hover raises to --surface-2 + accent hairline.
- Inputs: --surface-2, focus = accent border + soft glow. Terminal/code blocks use mono.
- Nav: fixed 68px, translucent #06070Dcc + blur(14px), bottom accent hairline on active.
- Add data-viz: gradient line charts, neon bars, monospace metric tiles.

## Motion
- Entrances fade + 10px rise, 70ms stagger; hover 180ms; keep a subtle ambient pulse
  on primary glow. Respect prefers-reduced-motion.

## Do / Don't
- Do: generous dark whitespace, monospace for numbers/labels, gradient text for hero.
- Don't: pure white backgrounds, more than two neon hues per view, low-contrast gray text.
""",
    ),
    (
        "builtin-warm-editorial",
        "Warm Editorial (built-in)",
        """\
# Warm Editorial Design System

Apply this system to every page; it wins over conflicting styling instructions.
A refined magazine/publishing look for blogs, journals, culture and premium brands.

## Core principles
- Paper-like warmth, editorial typography, generous measure and rhythm.
- Content-first: layout serves reading; decoration is minimal and intentional.
- A single confident accent gives identity without loudness.

## Color tokens (declare on :root, use everywhere)
- --bg: #FBF7F0; --surface: #FFFFFF; --surface-warm: #F3EBDD; --ink-block: #211D17
- --ink: #221F1A; --ink-soft: #5B5344; --ink-faint: #8A7F6C
- --rule: #E4D9C6; --rule-strong: #CBBB9F
- --accent: #B23A28 (terracotta); --accent-deep: #7C2D20; --gold: #B4884B
Rules: warm neutrals dominate; accent used for links, rules, drop-caps and highlights.
Maintain AA body contrast.

## Typography
- Display: "Fraunces" (or "Playfair Display"). Body: a readable serif "Source Serif 4"
  or clean sans "Inter". Caption/meta: "Inter".
- Large editorial headline 3.5–4.25rem; drop-cap on lead paragraphs; measure capped 66ch.
- Line-height 1.55 body, 1.1 headlines; small-caps section labels with letterspacing.

## Spacing, radius, elevation
- Baseline rhythm 8pt: 8,16,24,40,64,88,120. Column max-width 1120px; article 680px.
- Radius: mostly sharp (2–4px) for editorial feel; images 2px; pills for tags only.
- Elevation: minimal — rely on rules and whitespace; only subtle shadow on floating cards.

## Components
- Article cards: hairline top rule (1px --rule), kicker + serif headline + byline, no boxes.
- Buttons: text-forward with underline animation, or solid --ink for primary, --accent hover.
- Links: --accent with 1px underline; hover shifts to --accent-deep.
- Blockquote: oversized serif, left 3px --accent rule, italic.
- Pull quotes / figures with captions in --ink-faint; thin --rule dividers between sections.

## Motion
- Understated: fade/slide-up 400ms gentle ease; parallax only on hero imagery.
- Respect prefers-reduced-motion (disable parallax and slide).

## Do / Don't
- Do: editorial grids, asymmetric image/text pairings, refined rules, real photography.
- Don't: heavy shadows, rounded bubbles, neon colors, dense dashboards.
""",
    ),
    (
        "builtin-corporate-cobalt",
        "Corporate Cobalt (built-in)",
        """\
# Corporate Cobalt Design System

Apply this system to every page; it wins over conflicting styling instructions.
A trustworthy, data-dense enterprise/B2B SaaS look (analytics, dashboards, fintech).

## Core principles
- Calm, credible, information-rich; blue conveys trust, neutrals keep it professional.
- Density is fine when aligned: compact tables, clear hierarchy, tight but not cramped.
- Predictable, component-driven consistency beats decoration.

## Color tokens (declare on :root, use everywhere)
- --bg: #F6F8FB; --surface: #FFFFFF; --surface-alt: #EEF2F7; --canvas-dark: #0F1E33
- --brand-700: #1D4ED8; --brand-600: #2563EB; --brand-500: #3B82F6; --brand-100: #DBEAFE
- --text: #0F172A; --text-2: #475569; --text-3: #94A3B8
- --border: #E2E8F0; --border-strong: #CBD5E1
- --success: #059669; --warning: #D97706; --danger: #DC2626; --info: #0891B2
Rules: one blue family + slate neutrals + semantic status colors. Avoid more than one
saturated hue competing. AA contrast on all text and controls.

## Typography
- All UI: "Inter". Tabular numbers for metrics/tables (font-variant-numeric).
- Scale: 2.25 page-title / 1.5 section / 1.125 subhead / 1 body / 0.875 label / 0.75 caption.
- Weights 400/500/600/700; headings 600, tight -0.01em.

## Spacing, radius, elevation
- 4pt: 4,8,12,16,20,24,32,48. App shell: fixed sidebar 260px + topbar 64px + content.
- Radius: 6 inputs/buttons, 10 cards, 14 modals. Elevation: 3 subtle shadow levels.

## Components
- Buttons: primary solid --brand-600 (hover 700), secondary outline --border-strong,
  tertiary text; disabled 50%. Height md 40px.
- Tables: sticky header --surface-alt, 1px --border rows, zebra optional, row hover --brand-100,
  sortable column affordance, right-aligned numeric columns.
- KPI cards: label + big tabular number + delta chip (success/danger colored) + sparkline.
- Forms: 40px inputs, focus = --brand-500 ring; inline validation in --danger.
- Nav/sidebar: grouped items, active item --brand-100 bg + 2px --brand-600 left bar.
- Charts: categorical blues + semantic colors; gridlines in --border.

## Motion
- Functional only: 150ms transitions, hover elevations, skeleton shimmer while loading.
- Respect prefers-reduced-motion.

## Do / Don't
- Do: aligned grids, empty/loading/error states, breadcrumbs, toasts, modals.
- Don't: playful gradients, oversized decorative type, more than two hues per widget.
""",
    ),
    (
        "builtin-pastel-play",
        "Pastel Play (built-in)",
        """\
# Pastel Play Design System

Apply this system to every page; it wins over conflicting styling instructions.
A friendly, optimistic consumer look for wellness, food, kids, community and lifestyle.

## Core principles
- Soft, rounded, welcoming; low-saturation pastels with one saturated happy accent.
- Approachable and human: generous radii, playful but disciplined, tactile feedback.
- Delight via micro-interactions and shape, not clutter.

## Color tokens (declare on :root, use everywhere)
- --bg: #FFFBF7; --surface: #FFFFFF; --cream: #FEF3E7; --mist: #EAF4FF
- --mint: #B8F2D6; --peach: #FFD9BE; --lav: #DBD0FF; --sky: #C6E7FF; --blush: #FFD0DE
- --ink: #2A2438; --ink-2: #6B6482; --ink-3: #A8A0C0
- --brand: #7C6CF0 (grape); --brand-soft: #E4E0FF; --accent: #FF7A9C (coral)
- --success: #37C08F; --warning: #FFB443; --danger: #FF6B6B
Rules: pastel fills for surfaces, --brand/--accent for actions and highlights. Text always
deep grape (--ink) for contrast. Keep backgrounds airy, never muddy.

## Typography
- Display: "Baloo 2" or "Nunito" (rounded). Body/UI: "Nunito Sans" or "Quicksand".
- Scale: 3 / 2 / 1.5 / 1.125 / 1 / 0.875. Weights 400/600/800; headings 800 feel friendly.
- Rounded, generous line-height (1.5 body).

## Spacing, radius, elevation
- 4pt: 4,8,16,24,32,48,64,96. Container max 1080px, padding 20/40px.
- Radius is the signature: 16 inputs, 24 cards, 32 feature panels, 9999 pills/buttons.
- Elevation: soft colored shadows (brand-tinted), e.g. 0 12px 30px -12px rgba(124,108,240,.35).

## Components
- Buttons: pill, solid --brand (hover lift + deepen), secondary --brand-soft fill; springy
  active scale(0.97). Include an icon in most buttons.
- Cards: white surface, 24px radius, pastel top band or icon chip, hover gentle lift.
- Chips/tags: filled pastel pills with --ink text. Progress/steppers rounded.
- Inputs: 48px rounded, focus = brand ring + slight scale. Playful check states.
- Illustrations & emoji-free line icons (use a rounded icon set) over stock photos.

## Motion
- Lively: bounce/spring on entrance and press, floating decorative blobs, 200–300ms.
- Respect prefers-reduced-motion (replace springs with fades).

## Do / Don't
- Do: rounded shapes, pastel blocks, friendly mascot/illustration, tactile buttons.
- Don't: sharp corners, heavy dark surfaces, dense tables, neon or muted-gray palettes.
""",
    ),
    (
        "builtin-minimal-monochrome",
        "Minimal Monochrome (built-in)",
        """\
# Minimal Monochrome Design System

Apply this system to every page; it wins over conflicting styling instructions.
A rigorous Swiss-minimal, black-on-white aesthetic for portfolios, architecture and luxury.

## Core principles
- Reduction to essentials: whitespace, alignment, and type do the design work.
- A single near-black on near-white, plus hairline rules; optional one restrained accent.
- Precision over ornament; every element snap-aligned to a visible grid.

## Color tokens (declare on :root, use everywhere)
- --bg: #FAFAF9; --surface: #FFFFFF; --panel: #F2F2F0
- --ink: #141414; --ink-2: #55555A; --ink-3: #9A9A9E
- --line: #E4E4E2; --line-strong: #C7C7C4
- --accent: #141414 (default: monochrome). If identity needed, one hue only, e.g. --accent: #3F3F46.
Rules: no color fills except ink and hairlines. Contrast purely from weight, size and space.

## Typography
- Display & UI: "Neue Haas"/"Helvetica Neue" fallback, or "Inter"; optional mono "IBM Plex Mono"
  for labels/indices. All UI can be one family — hierarchy via size/weight/space only.
- Large light headlines (300/400 weight at 3.5–5rem), tiny uppercase mono labels with wide tracking.
- Measure 60–70ch; body 1rem/1.6.

## Spacing, radius, elevation
- Strict 8pt grid: 8,16,32,56,88,128. Wide margins; generous empty space as a feature.
- Radius: 0 (sharp) for layout and most elements; pills only for small tags. No rounding by default.
- Elevation: none or a single hairline border; no soft shadows.

## Components
- Buttons: bordered rectangle (1px --ink) with uppercase label, invert to filled --ink on hover.
- Links: ink with 1px underline extending left-to-right on hover.
- Cards/panels: white with 1px --line border, sharp corners, image + caption meta row.
- Use numbered indices, thin dividers, and a subtle baseline/grid feel.

## Motion
- Quiet and precise: opacity + small translate (4–8px), 200ms, ease-out; nothing bouncy.
- Respect prefers-reduced-motion.

## Do / Don't
- Do: strong grid, big negative space, mono micro-labels, editorial image treatment.
- Don't: color gradients, rounded bubbles, drop shadows, decorative illustration.
""",
    ),
    (
        "builtin-earth-organic",
        "Earth & Organic (built-in)",
        """\
# Earth & Organic Design System

Apply this system to every page; it wins over conflicting styling instructions.
A natural, grounded, sustainable aesthetic for wellness, food, nature and eco brands.

## Core principles
- Warm, muted, tactile; organic shapes and nature-derived color, calm and honest.
- Comfortable density with breathing room; hand-crafted, not sterile or techy.
- Color from the earth: greens, clay, sand — never synthetic neon.

## Color tokens (declare on :root, use everywhere)
- --bg: #F6F2EA; --surface: #FFFDF8; --sand: #ECE3D2; --bark: #241C12
- --moss: #4B6B4A; --sage: #8AA07E; --olive: #6B7A3A; --clay: #B5674A; --ochre: #C89A3C
- --ink: #2A2519; --ink-2: #5C5544; --ink-3: #8C8571
- --line: #DED4C0; --line-strong: #C4B79C
- --brand: var(--moss); --accent: var(--clay)
Rules: moss/olive for primary, clay/ochre for warmth and highlights, sand surfaces. AA text.

## Typography
- Display: a humanist serif "Fraunces" or "Bitter". Body: "Karla" or "Nunito Sans".
- Scale: 3.25 / 2.25 / 1.6 / 1.2 / 1 / 0.875. Headline 600, warm optical sizing.
- Rounded, organic feel; avoid stark geometric sans as the voice.

## Spacing, radius, elevation
- 4pt warm rhythm: 8,16,24,40,56,80,112. Container 1120px, padding 24/48px.
- Radius: organic — cards 20, buttons 14 or pill, images 24; can use blob/asymmetric radii
  (e.g. border-radius: 24px 24px 24px 4px) sparingly.
- Elevation: soft warm-tinted shadows (brown-tinted, low alpha).

## Components
- Buttons: solid --brand (hover deepen), secondary outline --line-strong; pill or 14px radius.
- Cards: --surface, 20px radius, hairline --line, hover gentle warm shadow lift.
- Tags/pills: sage/ochre tints with dark text; rounded ingredient/chip style.
- Photography: natural light, earthy duotone overlays; hand-drawn or leaf/line motifs.
- Dividers can be organic (curved SVG section separators) instead of straight rules.

## Motion
- Gentle and organic: slow fades and subtle scale/float, 300–450ms ease-out.
- Respect prefers-reduced-motion.

## Do / Don't
- Do: natural textures, botanical line art, warm neutrals, rounded organic forms.
- Don't: cold grays, cyberpunk glows, sharp Swiss minimalism, heavy saturated primaries.
""",
    ),
    (
        "builtin-bold-contrast",
        "Bold Contrast (built-in)",
        """\
# Bold Contrast Design System

Apply this system to every page; it wins over conflicting styling instructions.
A high-impact brutalist-fashion/agency look: stark black/white plus one electric accent.

## Core principles
- Loud confidence through scale and contrast, quiet palette: black, white, one electric hue.
- Big type, thick borders, tight crops; intentional tension from oversized elements.
- Structure is expressive — oversized labels, ticker strips, hard grids.

## Color tokens (declare on :root, use everywhere)
- --bg: #FFFFFF; --ink: #0A0A0A; --panel: #F2F2F0; --line: #0A0A0A
- --accent: #CCFF00 (electric lime). Alt accent option: #FF3B30 or #2B2BFF — pick ONE.
- --text on light = --ink; --text on dark/accent = --ink (lime) or #FFF (ink blocks).
Rules: only black, white and one accent. No gradients, no soft grays beyond --panel.
Ensure text stays legible (lime needs black text on it, never white).

## Typography
- Display: a heavy grotesque "Archivo Black" / "Anton" / very-bold "Inter" 800–900.
- Giant headline sizes (clamp up to 7–10rem), tight leading 0.95, uppercase, negative tracking.
- Body/UI: "Inter" or "Space Grotesk" regular; mono "Space Mono" for meta/labels.

## Spacing, radius, elevation
- Coarse grid: 16,24,40,64,96,140. Edge-to-edge sections, thick 2–3px --line borders.
- Radius: 0 — sharp rectangles define the aesthetic. No shadows; separation via borders/block color.

## Components
- Buttons: solid --ink or --accent rectangles, uppercase heavy label, 2px border, on hover
  swap fill/border (invert). No rounded, no soft lift — hard state flip.
- Ticker/marquee strip of repeated text between sections; oversized numbered section labels.
- Cards: 2px black border, white or panel fill, image crop tight, bold caption.
- Big image blocks with overlaid oversized type; sticky oversized headings.

## Motion
- Punchy: quick cuts, hard slide marquees, snap scale on press, 120–180ms. Scroll-linked reveals.
- Respect prefers-reduced-motion (freeze marquees and reveals).

## Do / Don't
- Do: oversized type, thick rules, black/white/lime, editorial collage, marquee energy.
- Don't: pastels, rounded softness, glassmorphism, multi-color palettes, gentle fades.
""",
    ),
]
