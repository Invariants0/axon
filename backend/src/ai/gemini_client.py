"""
Gemini API client for testing AXON pipeline without DigitalOcean Gradient.

This client provides async access to Google's Gemini API for hackathon testing.
Production mode should use DigitalOcean Gradient (gradient_client.py).
"""

from __future__ import annotations

import asyncio
from typing import Any

import httpx
from tenacity import (
    AsyncRetrying,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

from src.config.config import get_settings
from src.utils.logger import get_logger

logger = get_logger(__name__)


class GeminiClient:
    """
    Google Gemini API client for AXON testing mode.
    
    Supports:
    - Async chat completions
    - Automatic retry with exponential backoff
    - Timeout handling
    - Token usage logging
    """

    def __init__(self) -> None:
        self.settings = get_settings()
        self.base_url = "https://generativelanguage.googleapis.com/v1beta"
        self.model = self.settings.gemini_model or "gemini-2.5-flash"
        self.timeout = 60.0

    async def chat(
        self,
        messages: list[dict[str, str]],
        stream: bool = False,
        temperature: float = 0.2,
    ) -> dict[str, Any]:
        """
        Send chat completion request to Gemini API.

        Args:
            messages: List of message dicts with 'role' and 'content'
            stream: Streaming not yet supported (reserved for future)
            temperature: Sampling temperature (0.0-1.0)

        Returns:
            Response dict with choices, usage, and metadata
        """
        if stream:
            logger.warning("gemini_stream_not_supported", message="Streaming not implemented")

        # Convert OpenAI-style messages to Gemini format
        contents = self._convert_messages(messages)

        payload = {
            "contents": contents,
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": 2048,
            },
        }

        api_key = self.settings.gemini_api_key
        if not api_key:
            raise ValueError("GEMINI_API_KEY not configured")

        url = f"{self.base_url}/models/{self.model}:generateContent"

        # Retry logic for transient failures
        async for attempt in AsyncRetrying(
            stop=stop_after_attempt(3),
            wait=wait_exponential(min=1, max=8),
            retry=retry_if_exception_type((httpx.TimeoutException, httpx.NetworkError)),
            reraise=True,
        ):
            with attempt:
                response = await self._make_request(url, payload, api_key)

        # Convert Gemini response to OpenAI-compatible format
        return self._convert_response(response)

    async def _make_request(
        self,
        url: str,
        payload: dict[str, Any],
        api_key: str,
    ) -> dict[str, Any]:
        """Execute HTTP request with timeout."""
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                url,
                json=payload,
                params={"key": api_key},
                headers={"Content-Type": "application/json"},
            )
            response.raise_for_status()
            return response.json()

    def _convert_messages(self, messages: list[dict[str, str]]) -> list[dict[str, Any]]:
        """
        Convert OpenAI message format to Gemini format.

        OpenAI: [{"role": "user", "content": "text"}]
        Gemini: [{"role": "user", "parts": [{"text": "text"}]}]
        """
        contents = []
        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")

            # Map roles: system/assistant -> model, user -> user
            gemini_role = "model" if role in ("system", "assistant") else "user"

            contents.append({
                "role": gemini_role,
                "parts": [{"text": content}],
            })

        return contents

    def _convert_response(self, gemini_response: dict[str, Any]) -> dict[str, Any]:
        """
        Convert Gemini response to OpenAI-compatible format.

        Gemini: {"candidates": [{"content": {"parts": [{"text": "..."}]}}]}
        OpenAI: {"choices": [{"message": {"content": "..."}}], "usage": {...}}
        """
        candidates = gemini_response.get("candidates", [])
        text = ""

        if candidates:
            content = candidates[0].get("content", {})
            parts = content.get("parts", [])
            if parts:
                text = parts[0].get("text", "")

        # Extract token usage if available
        usage_metadata = gemini_response.get("usageMetadata", {})
        prompt_tokens = usage_metadata.get("promptTokenCount", 0)
        completion_tokens = usage_metadata.get("candidatesTokenCount", 0)
        total_tokens = usage_metadata.get("totalTokenCount", prompt_tokens + completion_tokens)

        # Log usage
        logger.info(
            "llm_call",
            provider="gemini",
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=total_tokens,
        )

        return {
            "choices": [
                {
                    "message": {
                        "role": "assistant",
                        "content": text,
                    },
                    "finish_reason": "stop",
                }
            ],
            "usage": {
                "prompt_tokens": prompt_tokens,
                "completion_tokens": completion_tokens,
                "total_tokens": total_tokens,
            },
            "model": self.model,
        }

    async def health(self) -> dict[str, str]:
        """Check Gemini client health status."""
        return {
            "provider": "gemini",
            "configured": "yes" if bool(self.settings.gemini_api_key) else "no",
            "model": self.model,
        }
