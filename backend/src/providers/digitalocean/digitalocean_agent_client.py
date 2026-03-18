from time import perf_counter
from typing import Any

import httpx
from tenacity import AsyncRetrying, retry_if_exception_type, stop_after_attempt, wait_exponential

from src.config.config import get_settings
from src.core.trace_context import TraceContext
from src.providers.digitalocean.circuit_breaker import CircuitBreaker, CircuitBreakerOpen
from src.providers.digitalocean.digitalocean_agent_types import AgentRequest, AgentResponse
from src.utils.logger import get_logger

logger = get_logger(__name__)


class DigitalOceanAgentError(Exception):
    """Base exception for DigitalOcean agent errors"""
    pass


class DigitalOceanAgentUnauthorized(DigitalOceanAgentError):
    """401 Unauthorized error"""
    pass


class DigitalOceanAgentNotFound(DigitalOceanAgentError):
    """404 Not Found error"""
    pass


class DigitalOceanAgentServerError(DigitalOceanAgentError):
    """5xx Server error"""
    pass


class DigitalOceanAgentTimeoutError(DigitalOceanAgentError):
    """Timeout error"""
    pass


class DigitalOceanAgentClient:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.api_token = self.settings.digitalocean_api_token
        self.timeout = float(self.settings.axon_agent_timeout)
        
        # PHASE-2: Circuit breaker for resilience
        # Protects against cascading failures when ADK agents are unavailable
        self._breaker = CircuitBreaker(
            name="digitalocean_agents",
            failure_threshold=5,
            recovery_timeout=60.0,
            half_open_max_calls=3,
        )

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
        """Retry with exponential backoff for transient errors"""
        async for attempt in AsyncRetrying(
            stop=stop_after_attempt(3),
            wait=wait_exponential(min=1, max=10),
            retry=retry_if_exception_type((
                httpx.HTTPError,
                httpx.TimeoutException,
                DigitalOceanAgentServerError,
                DigitalOceanAgentTimeoutError,
            )),
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
        """
        Call external ADK agent with circuit breaker protection.
        
        PHASE-2: Wrapped in circuit breaker to prevent cascading failures.
        PHASE-5: Enhanced with comprehensive error handling.
        """
        try:
            # Execute through circuit breaker
            return await self._breaker.call(
                self._call_agent_impl,
                agent_url=agent_url,
                request=request,
                trace_id=trace_id,
                session_id=session_id,
                stream=stream,
            )
        except CircuitBreakerOpen as exc:
            event = TraceContext.create_event(
                "agent.error",
                data={
                    "error_type": "circuit_breaker_open",
                    "agent_url": agent_url,
                    "message": str(exc),
                    "trace_id": trace_id,
                },
            )
            logger.warning(
                "agent_call_rejected_circuit_open",
                agent_url=agent_url,
                trace_id=trace_id,
                error=str(exc),
            )
            raise DigitalOceanAgentServerError(f"Circuit breaker open for {agent_url}") from exc
        except DigitalOceanAgentUnauthorized as exc:
            event = TraceContext.create_event(
                "agent.error",
                data={
                    "error_type": "unauthorized",
                    "agent_url": agent_url,
                    "message": "Invalid or missing API token",
                    "trace_id": trace_id,
                },
            )
            logger.error(
                "agent_call_unauthorized",
                agent_url=agent_url,
                trace_id=trace_id,
            )
            raise
        except DigitalOceanAgentNotFound as exc:
            event = TraceContext.create_event(
                "agent.error",
                data={
                    "error_type": "not_found",
                    "agent_url": agent_url,
                    "message": "Agent endpoint not found",
                    "trace_id": trace_id,
                },
            )
            logger.error(
                "agent_not_found",
                agent_url=agent_url,
                trace_id=trace_id,
            )
            raise
        except DigitalOceanAgentTimeoutError as exc:
            event = TraceContext.create_event(
                "agent.error",
                data={
                    "error_type": "timeout",
                    "agent_url": agent_url,
                    "message": f"Agent request timed out after {self.timeout}s",
                    "trace_id": trace_id,
                },
            )
            logger.error(
                "agent_call_timeout",
                agent_url=agent_url,
                timeout=self.timeout,
                trace_id=trace_id,
            )
            raise
        except DigitalOceanAgentError as exc:
            event = TraceContext.create_event(
                "agent.error",
                data={
                    "error_type": "agent_error",
                    "agent_url": agent_url,
                    "message": str(exc),
                    "trace_id": trace_id,
                },
            )
            logger.error(
                "agent_call_error",
                agent_url=agent_url,
                error=str(exc),
                trace_id=trace_id,
            )
            raise

    async def _call_agent_impl(
        self,
        agent_url: str,
        request: AgentRequest,
        trace_id: str | None = None,
        session_id: str | None = None,
        stream: bool = False,
    ) -> AgentResponse:
        """Implementation of agent call (wrapped by circuit breaker)."""
        started_at = perf_counter()
        payload = {
            "prompt": request.prompt,
            "stream": stream,
        }
        if request.context:
            payload["context"] = request.context

        headers = self._get_headers(trace_id, session_id)

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await self._retry_call(
                    client.post,
                    f"{agent_url}/run",
                    json=payload,
                    headers=headers,
                )
                response.raise_for_status()
                data = response.json()
        except httpx.TimeoutException as exc:
            logger.error(
                "agent_request_timeout",
                agent_url=agent_url,
                timeout=self.timeout,
                trace_id=trace_id,
            )
            raise DigitalOceanAgentTimeoutError(
                f"Agent request timed out after {self.timeout}s"
            ) from exc
        except httpx.HTTPStatusError as exc:
            status_code = exc.response.status_code
            
            if status_code == 401:
                logger.error(
                    "agent_unauthorized",
                    agent_url=agent_url,
                    trace_id=trace_id,
                )
                raise DigitalOceanAgentUnauthorized(
                    "Invalid or missing DIGITALOCEAN_API_TOKEN"
                ) from exc
            
            elif status_code == 404:
                logger.error(
                    "agent_not_found",
                    agent_url=agent_url,
                    trace_id=trace_id,
                )
                raise DigitalOceanAgentNotFound(
                    f"Agent endpoint not found: {agent_url}"
                ) from exc
            
            elif status_code >= 500:
                logger.error(
                    "agent_server_error",
                    agent_url=agent_url,
                    status_code=status_code,
                    trace_id=trace_id,
                )
                raise DigitalOceanAgentServerError(
                    f"Agent server error ({status_code}): {exc.response.text[:200]}"
                ) from exc
            
            else:
                logger.error(
                    "agent_http_error",
                    agent_url=agent_url,
                    status_code=status_code,
                    trace_id=trace_id,
                )
                raise DigitalOceanAgentError(
                    f"Agent request failed ({status_code}): {str(exc)[:200]}"
                ) from exc
        except httpx.HTTPError as exc:
            logger.error(
                "agent_http_connection_error",
                agent_url=agent_url,
                error=str(exc),
                trace_id=trace_id,
            )
            raise DigitalOceanAgentError(
                f"Failed to connect to agent: {str(exc)[:200]}"
            ) from exc

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
            llm_provider="digitalocean_adk",
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

    async def breaker_status(self) -> dict:
        """
        Get circuit breaker status (PHASE-2/3).
        
        Phase-3: Now async to support distributed backends.
        """
        return await self._breaker.status()

    async def reset_breaker(self) -> None:
        """Manually reset circuit breaker (PHASE-2)."""
        await self._breaker.reset()
        logger.info("circuit_breaker_reset_manually")
