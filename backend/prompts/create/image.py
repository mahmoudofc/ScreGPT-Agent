from openai.types.chat import ChatCompletionContentPartParam, ChatCompletionMessageParam

from prompts.prompt_types import Stack
from prompts import system_prompt
from prompts.custom_prompt import augment_system_prompt
from prompts.design_system import build_design_system_prompt_block
from prompts.policies import build_selected_stack_policy, build_user_image_policy

def build_image_prompt_messages(
    image_data_urls: list[str],
    stack: Stack,
    text_prompt: str,
    image_generation_enabled: bool,
    design_system: str | None = None,
    custom_prompt: str | None = None,
) -> list[ChatCompletionMessageParam]:
    image_policy = build_user_image_policy(image_generation_enabled)
    selected_stack = build_selected_stack_policy(stack)
    design_system_block = build_design_system_prompt_block(design_system)
    user_prompt = f"""
Generate code for a web page that looks exactly like the provided screenshot(s).

{selected_stack}
{design_system_block}

## Replication instructions

- Reproduce the layout, spacing, colors, typography and copy as faithfully as possible.
- Use the exact text from the screenshot. Do not invent, omit or reorder content.

## Render quality (match the source crisply)

- Reconstruct, don't screenshot: rebuild the UI as clean semantic HTML/CSS so text stays
  sharp and selectable and the page scales crisply at any size (never blur or embed the
  source as the layout).
- Match typography precisely: identify the closest web font for headings and body, and
  reproduce the real type scale, weights, letter-spacing, line-height and text colors.
- Reproduce the exact design tokens: sample colors faithfully, and match corner radii,
  borders, shadows/elevation, gradients, spacing and alignment so the result is visually
  indistinguishable from the original.
- Recreate icons with a proper icon set (or inline SVG) rather than emoji or blurry image
  crops, and keep interactive elements styled with sensible hover/focus states.

## Visual assets (follow this priority order to avoid mistakes)

1. Prefer real, re-usable assets. Crop extractable assets out of the screenshot with the
   extract_assets tool, one call per logical group of assets. After extracting, inspect each
   asset and re-extract if the crop is cut off, blurred, mis-cropped or includes neighboring
   elements.
2. Never embed the entire screenshot as a single image, and never use a full-page screenshot
   to fake layout. Only individual UI assets (logos, photos, icons, illustrations) are allowed.
3. For an asset that cannot be cleanly extracted (occluded, part of a background, or missing),
   generate a fresh image with generate_images when available. Write a precise prompt that matches
   the source's style, subject and aspect ratio, and request a matching aspect ratio.
4. Never use generate_images to reproduce text, spacing or the page structure — code those in HTML/CSS.
5. If an extracted or supplied asset is visibly low-resolution or pixelated and must render larger, upscale it with edit_images—not CSS stretching or generate_images.
6. Use edit_images for targeted edits (crop, remove unwanted objects, adjust colors); batch
   independent edits into a single call.
7. Only remove backgrounds (remove_backgrounds) for assets that genuinely need transparency.
   generate_images and edit_images cannot produce transparent backgrounds.
8. When image generation is unavailable or disabled, fall back to clean CSS shapes or a
   placeholder URL (https://placehold.co) rather than leaving broken/empty images.

- Keep every referenced image URL valid and reachable; do not emit broken <img> tags or empty src.
- {image_policy}

## Multiple screenshots

If multiple screenshots are provided, organize them meaningfully:

- If they appear to be different pages in a website, make them distinct pages and link them.
- If they look like different tabs or views in an app, connect them with appropriate navigation.
- If they appear unrelated, create a scaffold that separates them into "Screenshot 1", "Screenshot 2", "Screenshot 3", etc. so it is easy to navigate.
- For mobile screenshots, do not include the device frame or browser chrome; focus only on the actual UI mockups.
"""

    # Add additional instructions provided by the user
    if text_prompt.strip():
        user_prompt = f"{user_prompt}\n\nAdditional instructions: {text_prompt}"

    user_content: list[ChatCompletionContentPartParam] = []
    for image_data_url in image_data_urls:
        user_content.append(
            {
                "type": "image_url",
                "image_url": {"url": image_data_url, "detail": "high"},
            }
        )
    user_content.append(
        {
            "type": "text",
            "text": user_prompt,
        }
    )
    return [
        {
            "role": "system",
            "content": augment_system_prompt(
                system_prompt.SYSTEM_PROMPT, custom_prompt
            ),
        },
        {
            "role": "user",
            "content": user_content,
        },
    ]
