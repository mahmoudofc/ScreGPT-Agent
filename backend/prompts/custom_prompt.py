def build_custom_prompt_block(custom_prompt: str | None) -> str:
    if not custom_prompt or not custom_prompt.strip():
        return ""

    return f"""
## Custom system instructions

These user-authored instructions override conflicting guidance above, except
for explicit safety policy.

<custom_instructions>
{custom_prompt.strip()}
</custom_instructions>
"""


def augment_system_prompt(base_prompt: str, custom_prompt: str | None) -> str:
    """Append the user's custom system-prompt block to the base system prompt."""
    block = build_custom_prompt_block(custom_prompt)
    if not block:
        return base_prompt
    return f"{base_prompt}\n{block}"

