import os

NUM_VARIANTS = 4
NUM_VARIANTS_VIDEO = 2


def _parse_api_keys(raw: str | None) -> list[str]:
    """Split a comma/semicolon/newline-separated key list into clean keys.

    Lets a single env var carry multiple keys (e.g. GEMINI_API_KEY="a,b,c"),
    which the generation pipeline rotates across parallel variants.
    """
    if not raw:
        return []
    for sep in (",", ";", "\n"):
        raw = raw.replace(sep, "\n")
    return [part.strip() for part in raw.split("\n") if part.strip()]


# LLM-related
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", None)
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", None)
# Multiple Gemini keys may be supplied (comma/semicolon/newline separated).
# They are rotated across concurrent variants to multiply throughput and
# dodge per-key rate limits. GEMINI_API_KEY stays the first key for backward
# compatibility (evals, asset-extraction benchmark, single-key call sites).
GEMINI_API_KEYS = _parse_api_keys(os.environ.get("GEMINI_API_KEY", None))
GEMINI_API_KEY = GEMINI_API_KEYS[0] if GEMINI_API_KEYS else None
OPENAI_BASE_URL = os.environ.get("OPENAI_BASE_URL", None)


# Image generation (optional)
REPLICATE_API_KEY = os.environ.get("REPLICATE_API_KEY", None)

# Debugging-related
IS_DEBUG_ENABLED = bool(os.environ.get("IS_DEBUG_ENABLED", False))
DEBUG_DIR = os.environ.get("DEBUG_DIR", "")

# When enabled, every LLM request is written to run_logs/prompt_reports as a
# JSON report viewable at /evals/prompt-reports.
# Hard per-generation spend ceiling; a run that would continue past this is
# aborted. Applies per variant/eval run. Unpriced models are not bounded.
GENERATION_MAX_COST_USD = 3.0

PROMPT_REPORTS_ENABLED = os.environ.get(
    "PROMPT_REPORTS_ENABLED", ""
).strip().lower() in {"1", "true", "yes", "on"}
LOCAL_ASSET_DIR = os.environ.get(
    "LOCAL_ASSET_DIR", os.path.join(os.path.dirname(__file__), "local_assets")
)
# Base URL the backend serves /local-assets from. The live (websocket) path
# infers this per-request; the evals path has no request, so it uses this.
LOCAL_ASSET_BASE_URL = os.environ.get("LOCAL_ASSET_BASE_URL", "http://127.0.0.1:7001")

# Set to True when running in production (on the hosted version)
# Used as a feature flag to enable or disable certain features
IS_PROD = os.environ.get("IS_PROD", False)
