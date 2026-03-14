from typing import Any

import httpx

from src.config.config import get_settings


class HuggingFaceClient:
    def __init__(self) -> None:
        self.settings = get_settings()

    async def complete(self, prompt: str) -> dict[str, Any]:
        headers = {
            "Authorization": f"Bearer {self.settings.huggingface_api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "inputs": prompt,
            "parameters": {
                "max_new_tokens": 512,
                "return_full_text": False,
            },
        }
        model = self.settings.huggingface_model
        async with httpx.AsyncClient(timeout=90.0) as client:
            response = await client.post(
                f"https://api-inference.huggingface.co/models/{model}",
                headers=headers,
                json=payload,
            )
            response.raise_for_status()
            return response.json()

    async def health(self) -> dict[str, str]:
        return {
            "provider": "huggingface",
            "configured": "yes" if bool(self.settings.huggingface_api_key) else "no",
        }
