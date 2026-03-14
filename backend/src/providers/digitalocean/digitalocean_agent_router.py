from typing import Any

from src.config.config import get_settings
from src.providers.digitalocean.digitalocean_agent_client import DigitalOceanAgentClient
from src.providers.digitalocean.digitalocean_agent_types import AgentRequest, AgentResponse
from src.utils.logger import get_logger

logger = get_logger(__name__)


class DigitalOceanAgentRouter:
    def __init__(self, client: DigitalOceanAgentClient | None = None) -> None:
        self.settings = get_settings()
        self.client = client or DigitalOceanAgentClient()
        self.agent_urls = {
            "planning": self.settings.axon_planner_agent_url,
            "research": self.settings.axon_research_agent_url,
            "reasoning": self.settings.axon_reasoning_agent_url,
            "builder": self.settings.axon_builder_agent_url,
        }

    async def route_to_agent(
        self,
        agent_name: str,
        prompt: str,
        context: dict[str, Any] | None = None,
        trace_id: str | None = None,
        session_id: str | None = None,
        stream: bool = False,
    ) -> AgentResponse:
        agent_url = self.agent_urls.get(agent_name)
        if not agent_url:
            raise ValueError(f"Unknown agent: {agent_name}")

        request = AgentRequest(prompt=prompt, context=context)
        logger.info(
            "routing_to_agent",
            agent_name=agent_name,
            agent_url=agent_url,
            trace_id=trace_id,
            session_id=session_id,
        )
        
        response = await self.client.call_agent(agent_url, request, trace_id, session_id, stream)
        return response

    async def route_to_agent_stream(
        self,
        agent_name: str,
        prompt: str,
        context: dict[str, Any] | None = None,
        trace_id: str | None = None,
        session_id: str | None = None,
    ):
        agent_url = self.agent_urls.get(agent_name)
        if not agent_url:
            raise ValueError(f"Unknown agent: {agent_name}")

        request = AgentRequest(prompt=prompt, context=context)
        logger.info(
            "routing_to_agent_stream",
            agent_name=agent_name,
            agent_url=agent_url,
            trace_id=trace_id,
            session_id=session_id,
        )
        
        async for chunk in self.client.call_agent_stream(agent_url, request, trace_id, session_id):
            yield chunk

    async def health_check_all(self) -> dict[str, Any]:
        results = {}
        for agent_name, agent_url in self.agent_urls.items():
            if agent_url:
                results[agent_name] = await self.client.health_check(agent_url)
            else:
                results[agent_name] = {"status": "not_configured"}
        return results
