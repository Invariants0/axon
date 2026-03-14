from time import perf_counter
from typing import Any

import httpx
from tenacity import AsyncRetrying, retry_if_exception_type, stop_after_attempt, wait_exponential

from src.config.config import get_settings
from src.providers.digitalocean.digitalocean_agent_types import AgentRequest, AgentResponse
from src.utils.logger import get_logger

logger = get_logger(__name__)


class DigitalOceanAgentClient:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.api_token = self.settings.digitalocean_api_token
        self.timeout = float(self.settings.axon_agent_timeout)

    def _get_headers(self, trace_id: str | None = None, session_id: str | None = None) -> dict[str, str]:
        headers = {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json",
        }
        if trace_id:
            headers["X-Trace-ID"] = trace_id
        if session_id:
            headers["X-AXON-SESSION"] = session_id
        return headers

    async def _retry_call(self, func, *args, **kwargs) -> Any:
        async for attempt in AsyncRetrying(
            stop=stop_after_attempt(3),
            wait=wait_exponential(min=1, max=10),
            retry=retry_if_exception_type((httpx.HTTPError, httpx.TimeoutException)),
            reraise=True,
        ):
            with attempt:
                return await func(*args, **kwargs)

    async def call_agent(
        self,
        agent_url: str,
        request: AgentRequest,
        trace_id: str | None = None,
        session_id: str | None = None,
        stream: bool = False,
    ) -> AgentResponse:
        started_at = perf_counter()
        payload = {
            "prompt": request.prompt,
            "stream": stream,
        }
        if request.context:
            payload["context"] = request.context

        headers = self._get_headers(trace_id, session_id)

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await self._retry_call(
                client.post,
                f"{agent_url}/run",
                json=payload,
                headers=headers,
            )
            response.raise_for_status()
            data = response.json()

        latency = round(perf_counter() - started_at, 6)
        response_text = data.get("response", "")
        
        logger.info(
            "digitalocean_agent_call",
            agent_url=agent_url,
            latency=latency,
            prompt_size=len(request.prompt),
            response_size=len(response_text),
            trace_id=trace_id,
            session_id=session_id,
        )

        return AgentResponse(
            response=response_text,
            metadata=data.get("metadata"),
            trace_id=trace_id,
        )

    async def call_agent_stream(
        self,
        agent_url: str,
        request: AgentRequest,
        trace_id: str | None = None,
        session_id: str | None = None,
    ):
        payload = {
            "prompt": request.prompt,
            "stream": True,
        }
        if request.context:
            payload["context"] = request.context

        headers = self._get_headers(trace_id, session_id)

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            async with client.stream(
                "POST",
                f"{agent_url}/run",
                json=payload,
                headers=headers,
            ) as response:
                response.raise_for_status()
                async for chunk in response.aiter_text():
                    if chunk:
                        yield chunk

    async def health_check(self, agent_url: str) -> dict[str, Any]:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{agent_url}/health",
                    headers=self._get_headers(),
                )
                response.raise_for_status()
                return {"status": "healthy", "url": agent_url}
        except Exception as exc:
            logger.warning("agent_health_check_failed", agent_url=agent_url, error=str(exc))
            return {"status": "unhealthy", "url": agent_url, "error": str(exc)}
