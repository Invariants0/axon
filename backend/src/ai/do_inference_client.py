"""
DigitalOcean AI Inference client for production testing.

This client provides async access to DigitalOcean's AI inference endpoint
at https://inference.do-ai.run/v1/ for production-grade model access.
"""

from __future__ import annotations

import asyncio
from typing import Any, AsyncIterator

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


class DOInferenceClient:
    """
    DigitalOcean AI Inference client for production testing.
    
    Supports:
    - Async chat completions
    - Model listing
    - Automatic retry with exponential backoff
    - Timeout handling
    - Token usage logging
    """

    def __init__(self) -> None:
        self.settings = get_settings()
        self.base_url = "https://inference.do-ai.run/v1"
        self.model = "glm-5"  # Fixed model for production
        self.timeout = 60.0

    async def chat(
        self,
        messages: list[dict[str, str]],
        stream: bool = False,
        temperature: float = 0.2,
        max_tokens: int = 2048,
    ) -> dict[str, Any]:
        """
        Send chat completion request to DO AI Inference API.

        Args:
            messages: List of message dicts with 'role' and 'content'
            stream: Enable streaming responses
            temperature: Sampling temperature (0.0-1.0)
            max_tokens: Maximum tokens to generate

        Returns:
            Response dict with choices, usage, and metadata
        """
        payload = {
            "model": self.model,
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": temperature,
        }

        if stream:
            payload["stream"] = True

        api_key = self.settings.gradient_model_access_key
        if not api_key:
            raise ValueError("GRADIENT_MODEL_ACCESS_KEY not configured for DO Inference")

        url = f"{self.base_url}/chat/completions"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        }

        # Retry logic for transient failures
        async for attempt in AsyncRetrying(
            stop=stop_after_attempt(3),
            wait=wait_exponential(min=1, max=8),
            retry=retry_if_exception_type((httpx.TimeoutException, httpx.NetworkError)),
            reraise=True,
        ):
            with attempt:
                response = await self._make_request(url, payload, headers)

        # Log usage
        usage = response.get("usage", {})
        logger.info(
            "llm_call",
            provider="do_inference",
            model=self.model,
            prompt_tokens=usage.get("prompt_tokens", 0),
            completion_tokens=usage.get("completion_tokens", 0),
            total_tokens=usage.get("total_tokens", 0),
        )

        return response

    async def _make_request(
        self,
        url: str,
        payload: dict[str, Any],
        headers: dict[str, str],
    ) -> dict[str, Any]:
        """Execute HTTP request with timeout."""
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                url,
                json=payload,
                headers=headers,
            )
            response.raise_for_status()
            return response.json()

    async def list_models(self) -> dict[str, Any]:
        """
        List available models from DO AI Inference API.

        Returns:
            Response dict with available models
        """
        api_key = self.settings.gradient_model_access_key
        if not api_key:
            raise ValueError("GRADIENT_MODEL_ACCESS_KEY not configured for DO Inference")

        url = f"{self.base_url}/models"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            return response.json()

    async def health(self) -> dict[str, str]:
        """Check DO Inference client health status."""
        configured = bool(self.settings.gradient_model_access_key)
        
        # Try to list models if configured
        if configured:
            try:
                models = await self.list_models()
                model_count = len(models.get("data", []))
                return {
                    "provider": "do_inference",
                    "configured": "yes",
                    "model": self.model,
                    "available_models": str(model_count),
                    "status": "healthy",
                }
            except Exception as e:
                logger.error("do_inference_health_check_failed", error=str(e))
                return {
                    "provider": "do_inference",
                    "configured": "yes",
                    "model": self.model,
                    "status": "unhealthy",
                    "error": str(e)[:100],
                }
        
        return {
            "provider": "do_inference",
            "configured": "no",
            "model": self.model,
            "status": "not_configured",
        }
