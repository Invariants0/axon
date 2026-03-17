import json

from src.agents.base_agent import BaseAgent
from src.config.config import get_settings
from src.core.trace_context import TraceContext
from src.utils.logger import get_logger

logger = get_logger(__name__)


class ReasoningAgent(BaseAgent):
    agent_name = "reasoning"

    async def execute(self, task: dict) -> dict:
        """Execute reasoning agent with error handling (Phase-4)."""
        task_id = task["id"]
        
        # Set trace context
        TraceContext.set_task_id(task_id)
        
        try:
            settings = get_settings()
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
        except Exception as e:  # noqa: BLE001
            logger.exception("agent.reasoning.error", task_id=task_id, error=str(e))
            
            # Emit error event
            event = TraceContext.create_event(
                "agent.error",
                data={
                    "agent_name": self.agent_name,
                    "error": str(e),
                    "error_type": type(e).__name__,
                    "task_id": task_id,
                },
            )
            await self.event_bus.publish(event)
            
            # Re-raise to allow task manager to handle
            raise
