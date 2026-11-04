from prompts.prompt_types import Stack


def build_selected_stack_policy(stack: Stack) -> str:
    return f"Selected stack: {stack}."


def build_design_quality_policy() -> str:
    return (
        "Design like an award-winning product studio. Every page must look "
        "intentional, premium and shippable - never a generic AI template:\n"
        "- Establish a cohesive visual system up front: a deliberate palette "
        "(one dominant brand color + refined neutrals + 1-2 accents) exposed as "
        "CSS custom properties, a distinctive display font paired with a clean "
        "readable body font (from Google Fonts), and one consistent spacing, "
        "radius and elevation scale. Recommit to it on every section.\n"
        "- Compose a strong, specific hero: a bold oversized headline with real "
        "value-driven copy (no lorem), a supporting line, clear primary + "
        "secondary CTAs, and a focal visual (product shot, illustration or "
        "device mock). Avoid the default centered headline-plus-one-button cliché "
        "unless it truly fits.\n"
        "- Build clear typographic hierarchy: confident size jumps between hero / "
        "section titles / body / labels, tight tracked headings, generous "
        "line-height on body, and at most three weights on the page.\n"
        "- Give the layout rhythm and depth: an aligned grid, a consistent max "
        "content width, generous whitespace between blocks, subtle shadows / "
        "gradients / hairline borders for elevation, and consistent corner radii.\n"
        "- Make it feel alive: hover, focus and active states on every "
        "interactive element, smooth 150-300ms transitions, and tasteful "
        "entrance or micro animations (respect prefers-reduced-motion).\n"
        "- Craft real components, not boxes: buttons with icons and states, cards "
        "with hover lift, well-designed nav with active item, form fields with "
        "labels + focus rings, and working tabs / accordions / menus via "
        "dependency-free JS.\n"
        "- Fill the page with rich, believable content and every section the "
        "subject deserves (features, social proof, stats, gallery, pricing, FAQ, "
        "footer, etc.) with specific copy, real-sounding names, numbers and "
        "prices, a proper icon set (never emoji as icons), and real imagery "
        "instead of empty gray boxes.\n"
        "- Support a polished dark mode and AA color contrast; when the page "
        "renders on dark surfaces, keep text legible and shadows/overlays "
        "balanced.\n"
        "- Make it fully responsive with no horizontal scroll at 320px, stacked "
        "sections and touch-friendly hit targets; keep semantic heading order, "
        "alt text and visible focus rings.\n"
        "- Avoid generic AI aesthetics: no default system-font pages, no emoji "
        "icons, no lorem ipsum, no identical centered hero on every page, and no "
        "flat placeholder blocks - aim for a distinctive, cohesive look that "
        "could be shipped by a top design team."
    )


def build_design_consistency_policy() -> str:
    return (
        "Preserve the existing visual system exactly (palette, font pairing, "
        "spacing, corner radii, shadows, elevation and motion language). Any new "
        "or modified section must read as part of the same design: match its "
        "tokens and stay at the same - or a higher - level of polish, and extend "
        "the design rather than flattening or simplifying it."
    )



def build_user_image_policy(image_generation_enabled: bool) -> str:
    if image_generation_enabled:
        return (
            "Image generation is enabled for this request. Use generate_images for "
            "missing assets when needed."
        )

    return (
        "Image generation is disabled for this request. Do not call generate_images. "
        "Use provided media, CSS effects, or placeholder URLs (https://placehold.co)."
    )
