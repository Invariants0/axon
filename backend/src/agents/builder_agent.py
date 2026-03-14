from src.agents.base_agent import BaseAgent


class BuilderAgent(BaseAgent):
    agent_name = "builder"

    async def execute(self, task: dict) -> dict:
        task_id = task["id"]
        title = task["title"]
        description = task.get("description", "")
        plan = task.get("plan", {})
        reasoning = task.get("reasoning", {})

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
