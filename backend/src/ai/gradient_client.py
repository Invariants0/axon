from typing import Any

import httpx

from src.config.config import get_settings


class GradientClient:
    def __init__(self) -> None:
        self.settings = get_settings()

    async def chat(self, messages: list[dict[str, str]], stream: bool = False) -> dict[str, Any]:
        payload = {
            "model": self.settings.gradient_model,
            "messages": messages,
            "stream": stream,
        }
        headers = {
            "Authorization": f"Bearer {self.settings.gradient_api_key}",
            "Content-Type": "application/json",
        }
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{self.settings.gradient_base_url.rstrip('/')}/chat/completions",
                json=payload,
                headers=headers,
            )
            response.raise_for_status()
            return response.json()

    async def health(self) -> dict[str, str]:
        return {
            "provider": "gradient",
            "configured": "yes" if bool(self.settings.gradient_api_key) else "no",
        }
