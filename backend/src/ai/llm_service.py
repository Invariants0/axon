from __future__ import annotations

from collections.abc import AsyncGenerator
import json
from typing import Any

from tenacity import AsyncRetrying, retry_if_exception_type, stop_after_attempt, wait_exponential

from src.ai.gradient_client import GradientClient
from src.ai.huggingface_client import HuggingFaceClient
from src.config.config import get_settings
from src.utils.logger import get_logger

logger = get_logger(__name__)


class LLMService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.gradient = GradientClient()
        self.huggingface = HuggingFaceClient()
        self._local_pipeline = None

    def _test_mode_response(self, messages: list[dict[str, str]]) -> str:
        prompt = "\n".join([f"{m['role']}: {m['content']}" for m in messages]).lower()
        if "refine this task plan" in prompt:
            return json.dumps(
                {
                    "steps": [
                        "analyze task",
                        "research context",
                        "generate solution",
                    ]
                }
            )
        if "summarize practical research notes" in prompt:
            return json.dumps({"notes": "mock research context"})
        if "evaluate this strategy and provide final reasoning" in prompt:
            return json.dumps({"evaluation": "mock evaluation of strategy"})
        if "produce the final solution summary" in prompt:
            return json.dumps({"solution": "mock generated solution"})
        return json.dumps({"response": "mock deterministic response"})

    async def _retry_call(self, func, *args, **kwargs) -> Any:
        async for attempt in AsyncRetrying(
            stop=stop_after_attempt(3),
            wait=wait_exponential(min=1, max=8),
            retry=retry_if_exception_type(Exception),
            reraise=True,
        ):
            with attempt:
                return await func(*args, **kwargs)

    def _extract_text(self, response: dict[str, Any]) -> str:
        choices = response.get("choices") or []
        if choices:
            message = choices[0].get("message") or {}
            if isinstance(message, dict):
                return str(message.get("content", ""))
        if isinstance(response, list) and response and isinstance(response[0], dict):
            return str(response[0].get("generated_text", ""))
        return str(response)

    def _log_usage(self, response: dict[str, Any], provider: str) -> None:
        usage = response.get("usage", {}) if isinstance(response, dict) else {}
        logger.info(
            "llm_call",
            provider=provider,
            prompt_tokens=usage.get("prompt_tokens"),
            completion_tokens=usage.get("completion_tokens"),
            total_tokens=usage.get("total_tokens"),
        )

    async def complete(self, prompt: str) -> str:
        messages = [{"role": "user", "content": prompt}]
        response = await self.chat(messages)
        return response

    async def chat(self, messages: list[dict[str, str]]) -> str:
        if self.settings.test_mode:
            logger.info("llm_call", provider="test-mode")
            return self._test_mode_response(messages)

        if self.settings.axon_mode == "real":
            logger.warning(
                "llm_direct_call_in_real_mode",
                message="Backend LLM should not be called in real mode. All reasoning must go through ADK agents.",
            )
            return "ERROR: Direct LLM calls disabled in real mode. Use ADK agents."

        if self.settings.gradient_api_key:
            try:
                response = await self._retry_call(self.gradient.chat, messages, False)
                self._log_usage(response, "gradient")
                return self._extract_text(response)
            except Exception as exc:  # noqa: BLE001
                logger.warning("gradient_fallback", error=str(exc))

        if self.settings.huggingface_api_key:
            try:
                prompt = "\n".join([f"{m['role']}: {m['content']}" for m in messages])
                response = await self._retry_call(self.huggingface.complete, prompt)
                logger.info("llm_call", provider="huggingface")
                return self._extract_text(response)
            except Exception as exc:  # noqa: BLE001
                logger.warning("huggingface_fallback", error=str(exc))

        return await self._local_complete(messages)

    async def stream(self, messages: list[dict[str, str]]) -> AsyncGenerator[str, None]:
        text = await self.chat(messages)
        for token in text.split():
            yield token + " "

    async def _local_complete(self, messages: list[dict[str, str]]) -> str:
        content = "\n".join([f"{m['role']}: {m['content']}" for m in messages])
        if self._local_pipeline is None:
            try:
                from transformers import pipeline  # type: ignore

                self._local_pipeline = pipeline("text-generation", model="distilgpt2")
            except Exception:  # noqa: BLE001
                self._local_pipeline = False

        if self._local_pipeline:
            result = self._local_pipeline(content, max_new_tokens=120)
            if isinstance(result, list) and result:
                generated = str(result[0].get("generated_text", ""))
                return generated[-1000:]

        logger.info("llm_call", provider="local-fallback")
        return f"Fallback response: {messages[-1]['content'][:500]}"
