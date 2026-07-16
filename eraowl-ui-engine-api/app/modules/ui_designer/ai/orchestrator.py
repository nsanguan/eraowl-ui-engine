from __future__ import annotations

import json
from typing import Any

import httpx

from app.core.config import settings


class AIOrchestrator:
    def __init__(self):
        self.provider = settings.AI_PROVIDER
        self.api_key = settings.AI_API_KEY
        self.model = settings.AI_MODEL
        self.base_url = settings.AI_BASE_URL

    async def generate_layout(self, prompt: str) -> dict[str, Any]:
        system_prompt = """You are an AI assistant that generates layout_json for the EraOwl UI Engine.
        
Return ONLY valid JSON matching this schema:
{
  "schemaVersion": "1.0.0",
  "regions": [
    {
      "id": "string",
      "title": "string",
      "components": [
        {
          "id": "string",
          "type": "Region" | "Lov" | "LovSelect",
          "position": {"x": 0, "y": 0, "width": 200, "height": 40}
        }
      ]
    }
  ]
}

Available component types: Region, Lov, LovSelect.
Do not include any explanation, just the JSON."""

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": self.model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": prompt},
                    ],
                    "max_tokens": 2048,
                    "temperature": 0.3,
                },
                timeout=settings.AI_TIMEOUT,
            )
            
            if response.status_code != 200:
                raise Exception(f"AI API error: {response.status_code}")
            
            data = response.json()
            content = data["choices"][0]["message"]["content"]
            
            return json.loads(content)

    async def suggest_codegen(self, layout: dict, target_project: str) -> dict[str, Any]:
        system_prompt = f"""You are an AI assistant that suggests React component code for the EraOwl UI Engine codegen pipeline.

Target project: {target_project}
Generate TypeScript React component code for each component in the layout.

Return a JSON object mapping filenames to file contents.
Do not include any explanation, just the JSON."""

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": self.model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": f"Layout JSON:\n{json.dumps(layout, indent=2)}"},
                    ],
                    "max_tokens": 4096,
                    "temperature": 0.3,
                },
                timeout=settings.AI_TIMEOUT,
            )
            
            if response.status_code != 200:
                raise Exception(f"AI API error: {response.status_code}")
            
            data = response.json()
            content = data["choices"][0]["message"]["content"]
            
            return json.loads(content)


ai_orchestrator = AIOrchestrator()
