"""
Gemini (Google Gen AI) — all API key and model name live here so route handlers
stay thin. We use the current `google-genai` SDK (not the deprecated
`google-generativeai` package).
"""

import json
import os
import re
from typing import Any, Optional

from dotenv import load_dotenv
from google import genai

load_dotenv()

_api_key = os.getenv("GEMINI_API_KEY", "").strip()
_model_id = os.getenv("GEMINI_MODEL", "gemini-2.0-flash").strip()

# One client is enough; it only holds your key, actual calls are stateless.
_client: Optional[genai.Client] = None


def is_configured() -> bool:
    return bool(_api_key)


def _get_client() -> genai.Client:
    global _client
    if not is_configured():
        raise RuntimeError(
            "GEMINI_API_KEY is not set. Add it to backend/.env to enable AI routes."
        )
    if _client is None:
        # Env var is the usual story in dev; in prod you'd inject the key safely.
        _client = genai.Client(api_key=_api_key)
    return _client


def _strip_json_fence(text: str) -> str:
    # Models still occasionally wrap JSON in ```json … ```; strip that so loads() works.
    t = text.strip()
    if t.startswith("```"):
        t = re.sub(r"^```(?:json)?\s*", "", t)
        t = re.sub(r"\s*```$", "", t)
    return t.strip()


def generate_text(prompt: str) -> str:
    """Plain text completion — used as the base for our JSON endpoints."""
    response = _get_client().models.generate_content(
        model=_model_id,
        contents=prompt,
    )
    # New SDK: aggregated text is on `.text` when the model returns plain text.
    if not response.text:
        raise RuntimeError("Gemini returned an empty response.")
    return response.text


def generate_json_object(prompt: str) -> Any:
    """
    Asks for strict JSON, then parses it. FastAPI can return the dict as-is so
    the front end keeps the same contract as before.
    """
    full_prompt = f"""{prompt}

Reply with a single JSON value only (object or array). No markdown, no code fences, no explanation."""
    raw = generate_text(full_prompt)
    try:
        return json.loads(_strip_json_fence(raw))
    except json.JSONDecodeError as e:
        raise ValueError(
            f"Model did not return valid JSON: {e}\n--- raw ---\n{raw[:2000]}"
        ) from e
