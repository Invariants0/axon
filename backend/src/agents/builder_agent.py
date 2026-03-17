import json

from src.agents.base_agent import BaseAgent
from src.config.config import get_settings
from src.core.trace_context import TraceContext
from src.utils.logger import get_logger

logger = get_logger(__name__)






class BuilderAgent(BaseAgent):
    agent_name = "builder"

    async def execute(self, task: dict) -> dict:
        """Execute builder agent with error handling (Phase-4)."""
        task_id = task["id"]
        
        # Set trace context
        TraceContext.set_task_id(task_id)
        
        try:
            settings = get_settings()
            title = task["title"]
            description = task.get("description", "")
            plan = task.get("plan", {})
            reasoning = task.get("reasoning", {})

            if settings.axon_mode == "real" and self.digitalocean_router:
                prompt = (
                    f"Task: {title}\nDescription: {description}\n"
                    f"Plan: {json.dumps(plan)}\nReasoning: {json.dumps(reasoning)}\n"
                    "Generate the final solution."
                )
                response = await self.digitalocean_router.route_to_agent(
                    "builder",
                    prompt,
                    {"task_id": task_id, "plan": plan, "reasoning": reasoning},
                    trace_id=task_id,
                )
                try:
                    build_data = json.loads(response.response)
                except json.JSONDecodeError:
                    build_data = {"raw": response.response}
                
                result = {
                    "agent": self.agent_name,
                    "build": build_data,
                    "final": response.response,
                }
            else:
                code_draft = await self.skills.execute(
                    "coding",
                    {
                        "task": f"{title}\n{description}",
                        "plan": plan,
                    },
                )
                response = await self.llm.complete(
                    "Produce the final solution summary based on this plan and reasoning.\n"
                    f"Task: {title}\nDescription: {description}\nPlan: {plan}\nReasoning: {reasoning}\n"
                    f"Draft: {code_draft['output']}"
                )
                result = {
                    "agent": self.agent_name,
                    "build": code_draft["output"],
                    "final": response,
                }

            await self._remember(task_id, str(result), "build_output")
            await self._emit("agent.step", {"task_id": task_id, "agent": self.agent_name, "data": result})
            return result
        except Exception as e:  # noqa: BLE001
            logger.exception("agent.builder.error", task_id=task_id, error=str(e))
            
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
