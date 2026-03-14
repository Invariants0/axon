import json

from src.agents.base_agent import BaseAgent
from src.config.config import get_settings


class ReasoningAgent(BaseAgent):
    agent_name = "reasoning"

    async def execute(self, task: dict) -> dict:
        settings = get_settings()
        task_id = task["id"]
        title = task["title"]
        context = await self._load_context(title, task_id)
        plan = task.get("plan", {})

        if settings.axon_mode == "real" and self.digitalocean_router:
            prompt = (
                f"Task: {title}\nPlan: {json.dumps(plan)}\nContext: {context}\n"
                "Evaluate the strategy and provide detailed reasoning."
            )
            response = await self.digitalocean_router.route_to_agent(
                "reasoning",
                prompt,
                {"task_id": task_id, "plan": plan},
                trace_id=task_id,
            )
            try:
                reasoning_data = json.loads(response.response)
            except json.JSONDecodeError:
                reasoning_data = {"raw": response.response}
            
            result = {
                "agent": self.agent_name,
                "analysis": reasoning_data,
                "rationale": response.response,
            }
        else:
            skill_result = await self.skills.execute("reasoning", {"plan": plan, "context": context})
            rationale = await self.llm.complete(
                "Evaluate this strategy and provide final reasoning.\n"
                f"Task: {title}\nPlan: {plan}\nContext:{context}\n"
                f"Heuristic: {skill_result['output']}"
            )
            result = {
                "agent": self.agent_name,
                "analysis": skill_result["output"],
                "rationale": rationale,
            }

        await self._remember(task_id, str(result), "reasoning")
        await self._emit("agent.step", {"task_id": task_id, "agent": self.agent_name, "data": result})
        return result
