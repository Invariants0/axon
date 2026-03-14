from src.agents.base_agent import BaseAgent


class PlanningAgent(BaseAgent):
    agent_name = "planning"

    async def execute(self, task: dict) -> dict:
        task_id = task["id"]
        title = task["title"]
        description = task.get("description", "")
        context = await self._load_context(f"{title}\n{description}", task_id)

        skill_result = await self.skills.execute(
            "planning",
            {"task": f"{title}\n{description}", "max_steps": 5},
        )
        llm_refinement = await self.llm.complete(
            "Refine this task plan into concise actionable steps:\n"
            f"Task: {title}\nDescription: {description}\nContext:{context}\n"
            f"Draft: {skill_result['output']}"
        )

        result = {
            "agent": self.agent_name,
            "plan": skill_result["output"],
            "llm_refinement": llm_refinement,
        }
        await self._remember(task_id, str(result), "agent_thought")
        await self._emit("agent.step", {"task_id": task_id, "agent": self.agent_name, "data": result})
        return result
