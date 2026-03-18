import json

from src.agents.base_agent import BaseAgent
from src.config.config import get_settings
from src.core.trace_context import TraceContext
from src.utils.logger import get_logger

logger = get_logger(__name__)


class PlanningAgent(BaseAgent):
    agent_name = "planning"

    async def execute(self, task: dict) -> dict:
        """Execute planning agent with error handling (Phase-4) and observability (Phase-5)."""
        task_id = task["id"]
        
        # Set trace context
        TraceContext.set_task_id(task_id)
        
        try:
            settings = get_settings()
            title = task["title"]
            description = task.get("description", "")
            context = await self._load_context(f"{title}\n{description}", task_id)

            if settings.axon_mode == "real" and self.digitalocean_router:
                logger.info(
                    "agent.execution",
                    agent_name=self.agent_name,
                    mode="real",
                    provider="digitalocean_adk",
                    task_id=task_id,
                )
                
                prompt = (
                    f"Task: {title}\nDescription: {description}\nContext: {context}\n"
                    "Create a detailed plan with actionable steps."
                )
                response = await self.digitalocean_router.route_to_agent(
                    "planning",
                    prompt,
                    {"task_id": task_id},
                    trace_id=task_id,
                )
                
                event = TraceContext.create_event(
                    "agent.step",
                    data={
                        "agent_name": self.agent_name,
                        "mode": "real",
                        "provider": "digitalocean_adk",
                        "task_id": task_id,
                    },
                )
                await self.event_bus.publish(event)
                
                try:
                    plan_data = json.loads(response.response)
                except json.JSONDecodeError:
                    plan_data = {"raw": response.response}
                
                result = {
                    "agent": self.agent_name,
                    "plan": plan_data,
                    "llm_refinement": response.response,
                }
            else:
                mode = settings.axon_mode
                logger.info(
                    "agent.execution",
                    agent_name=self.agent_name,
                    mode=mode,
                    provider="llm_service",
                    task_id=task_id,
                )
                
                skill_result = await self.skills.execute(
                    "planning",
                    {"task": f"{title}\n{description}", "max_steps": 5},
                )
                llm_refinement = await self.llm.complete(
                    "Refine this task plan into concise actionable steps:\n"
                    f"Task: {title}\nDescription: {description}\nContext:{context}\n"
                    f"Draft: {skill_result['output']}"
                )
                
                event = TraceContext.create_event(
                    "agent.step",
                    data={
                        "agent_name": self.agent_name,
                        "mode": mode,
                        "provider": "llm_service",
                        "task_id": task_id,
                    },
                )
                await self.event_bus.publish(event)
                
                result = {
                    "agent": self.agent_name,
                    "plan": skill_result["output"],
                    "llm_refinement": llm_refinement,
                }

            await self._remember(task_id, str(result), "agent_thought")
            await self._emit("agent.step", {"task_id": task_id, "agent": self.agent_name, "data": result})
            return result
        except Exception as e:  # noqa: BLE001
            logger.exception("agent.planning.error", task_id=task_id, error=str(e))
            
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
