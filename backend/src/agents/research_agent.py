import json

from src.agents.base_agent import BaseAgent
from src.config.config import get_settings


class ResearchAgent(BaseAgent):
    agent_name = "research"

    async def execute(self, task: dict) -> dict:
        settings = get_settings()
        task_id = task["id"]
        title = task["title"]
        description = task.get("description", "")
        context = await self._load_context(f"{title}\n{description}", task_id)

        if settings.axon_mode == "real" and self.digitalocean_router:
            prompt = (
                f"Task: {title}\nDescription: {description}\nContext: {context}\n"
                "Conduct research and provide comprehensive notes."
            )
            response = await self.digitalocean_router.route_to_agent(
                "research",
                prompt,
                {"task_id": task_id, "plan": task.get("plan", {})},
                trace_id=task_id,
            )
            try:
                research_data = json.loads(response.response)
            except json.JSONDecodeError:
                research_data = {"raw": response.response}
            
            result = {
                "agent": self.agent_name,
                "research": research_data,
                "synthesis": response.response,
            }
        else:
            skill_result = await self.skills.execute("web_search", {"query": f"{title} {description}".strip()})
            synthesis = await self.llm.complete(
                "Summarize practical research notes for this task.\n"
                f"Task: {title}\nDescription: {description}\nContext:{context}\n"
                f"Notes: {skill_result['output']}"
            )
            result = {
                "agent": self.agent_name,
                "research": skill_result["output"],
                "synthesis": synthesis,
            }

        await self._remember(task_id, str(result), "research")
        await self._emit("agent.step", {"task_id": task_id, "agent": self.agent_name, "data": result})
        return result
