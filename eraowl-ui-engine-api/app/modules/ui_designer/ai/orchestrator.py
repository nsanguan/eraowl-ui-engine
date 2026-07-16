"""AI Orchestrator — §9 AI Agent Rules.

Uses OpenRouter API with configurable model. Supports:
- Retry with exponential backoff
- Fallback provider when primary fails
- JSON extraction from markdown-wrapped responses
- Reusable httpx.AsyncClient
"""

from __future__ import annotations

import asyncio
import json
import logging
import re
from typing import Any, cast

import httpx

from app.core.config import settings
from app.schema_validation.validator import COMPONENT_TYPES
from app.shared.exceptions import AIOrchestrationError

logger = logging.getLogger(__name__)

# Regex to extract JSON from markdown code fences: ```json ... ``` or ``` ... ```
_JSON_FENCE_RE = re.compile(r"```(?:json)?\s*\n?(.*?)\n?\s*```", re.DOTALL)

_MAX_RETRIES = 3
_BASE_BACKOFF_S = 1.0


def _extract_json(content: str) -> dict[str, Any]:
    """Extract JSON from AI response, handling markdown-wrapped output."""
    content = content.strip()

    # Try direct parse first
    try:
        return cast("dict[str, Any]", json.loads(content))
    except json.JSONDecodeError:
        pass

    # Try extracting from markdown code fences
    match = _JSON_FENCE_RE.search(content)
    if match:
        try:
            return cast("dict[str, Any]", json.loads(match.group(1).strip()))
        except json.JSONDecodeError:
            pass

    raise AIOrchestrationError(detail=f"Failed to parse AI response as JSON: {content[:200]}")


class AIOrchestrator:
    """Orchestrates AI calls with retry and fallback support."""

    def __init__(self) -> None:
        self.provider = settings.AI_PROVIDER
        self.api_key = settings.AI_API_KEY
        self.model = settings.AI_MODEL
        self.base_url = settings.AI_BASE_URL
        self._client: httpx.AsyncClient | None = None

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(timeout=settings.AI_TIMEOUT)
        return self._client

    async def _call_provider(
        self,
        *,
        base_url: str,
        api_key: str,
        model: str,
        messages: list[dict[str, str]],
        max_tokens: int,
        temperature: float,
    ) -> str:
        """Make a single call to an AI provider. Returns raw content string."""
        client = await self._get_client()
        try:
            response = await client.post(
                f"{base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model,
                    "messages": messages,
                    "max_tokens": max_tokens,
                    "temperature": temperature,
                },
            )
        except httpx.HTTPError as exc:
            raise AIOrchestrationError(detail=f"HTTP error calling AI provider: {exc}") from exc

        if response.status_code != 200:
            raise AIOrchestrationError(
                detail=f"AI API returned {response.status_code}: {response.text[:300]}"
            )

        data = response.json()
        try:
            return cast("str", data["choices"][0]["message"]["content"])
        except (KeyError, IndexError) as exc:
            raise AIOrchestrationError(detail=f"Unexpected AI response structure: {data}") from exc

    async def _call_with_retry(
        self,
        messages: list[dict[str, str]],
        max_tokens: int = 2048,
        temperature: float = 0.3,
    ) -> str:
        """Try primary provider with exponential-backoff retry, then fallback."""
        last_exc: Exception | None = None

        for attempt in range(1, _MAX_RETRIES + 1):
            try:
                return await self._call_provider(
                    base_url=self.base_url,
                    api_key=self.api_key,
                    model=self.model,
                    messages=messages,
                    max_tokens=max_tokens,
                    temperature=temperature,
                )
            except AIOrchestrationError as exc:
                last_exc = exc
                if attempt < _MAX_RETRIES:
                    delay = _BASE_BACKOFF_S * (2 ** (attempt - 1))
                    logger.warning(
                        "AI provider call attempt %d/%d failed: %s — retrying in %.1fs",
                        attempt, _MAX_RETRIES, exc, delay,
                    )
                    await asyncio.sleep(delay)

        # All primary retries exhausted — try fallback if configured.
        if settings.AI_FALLBACK_PROVIDER and settings.AI_FALLBACK_API_KEY:
            logger.warning(
                "Primary AI provider failed after %d retries, trying fallback: %s",
                _MAX_RETRIES,
                settings.AI_FALLBACK_PROVIDER,
            )
            try:
                fallback_model = settings.AI_FALLBACK_MODEL or self.model
                return await self._call_provider(
                    base_url=settings.AI_BASE_URL,
                    api_key=settings.AI_FALLBACK_API_KEY,
                    model=fallback_model,
                    messages=messages,
                    max_tokens=max_tokens,
                    temperature=temperature,
                )
            except AIOrchestrationError as exc:
                last_exc = exc

        raise AIOrchestrationError(
            detail=(
                f"AI provider failed after {_MAX_RETRIES} retries "
                f"(fallback {'tried' if settings.AI_FALLBACK_PROVIDER else 'not configured'}): "
                f"{last_exc}"
            )
        ) from last_exc

    async def generate_layout(self, prompt: str) -> dict[str, Any]:
        """Generate layout_json from a natural-language prompt."""
        allowed_types = ", ".join(COMPONENT_TYPES)
        system_prompt = f"""You are an AI assistant that generates layout_json for the EraOwl UI Engine.

Return ONLY valid JSON matching this schema:
{{
  "schemaVersion": "1.0.0",
  "regions": [
    {{
      "id": "string",
      "title": "string",
      "components": [
        {{
          "id": "string",
          "type": "<one_of_the_types>",
          "position": {{"x": 0, "y": 0, "width": 200, "height": 40}}
        }}
      ]
    }}
  ]
}}

Available component types (the "type" field MUST be EXACTLY one of these, case-sensitive): {allowed_types}.
Do not include any explanation, just the JSON."""

        content = await self._call_with_retry(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt},
            ],
            max_tokens=2048,
            temperature=0.3,
        )
        return _extract_json(content)

    async def suggest_codegen(self, layout: dict[str, Any], target_project: str) -> dict[str, Any]:
        """Suggest React component code from a layout_json."""
        system_prompt = (
            f"You are an AI assistant that suggests React component code for the "
            f"EraOwl UI Engine codegen pipeline.\n\n"
            f"Target project: {target_project}\n"
            f"Generate TypeScript React component code for each component in the layout.\n\n"
            f"Return a JSON object mapping filenames to file contents.\n"
            f"Do not include any explanation, just the JSON."
        )

        content = await self._call_with_retry(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Layout JSON:\n{json.dumps(layout, indent=2)}"},
            ],
            max_tokens=settings.AI_MAX_TOKENS,
            temperature=0.3,
        )
        return _extract_json(content)

    async def close(self) -> None:
        """Close the underlying HTTP client."""
        if self._client and not self._client.is_closed:
            await self._client.aclose()


ai_orchestrator = AIOrchestrator()
