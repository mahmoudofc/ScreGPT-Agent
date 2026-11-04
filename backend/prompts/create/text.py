from openai.types.chat import ChatCompletionMessageParam

from prompts.prompt_types import Stack
from prompts import system_prompt
from prompts.custom_prompt import augment_system_prompt
from prompts.design_system import build_design_system_prompt_block
from prompts.policies import (
    build_design_quality_policy,
    build_selected_stack_policy,
    build_user_image_policy,
)


def build_text_prompt_messages(
    text_prompt: str,
    stack: Stack,
    image_generation_enabled: bool,
    design_system: str | None = None,
    custom_prompt: str | None = None,
) -> list[ChatCompletionMessageParam]:
    image_policy = build_user_image_policy(image_generation_enabled)
    selected_stack = build_selected_stack_policy(stack)
    design_system_block = build_design_system_prompt_block(design_system)
    design_quality = build_design_quality_policy()

    USER_PROMPT = f"""
Generate UI for {text_prompt}.
{selected_stack}
{design_system_block}

# Instructions

{design_quality}
- Follow UX best practices.
- {image_policy}"""

    return [
        {
            "role": "system",
            "content": augment_system_prompt(
                system_prompt.SYSTEM_PROMPT, custom_prompt
            ),
        },
        {
            "role": "user",
            "content": USER_PROMPT,
        },
    ]
