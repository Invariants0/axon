from src.agents.base_agent import BaseAgent


class ReasoningAgent(BaseAgent):
    agent_name = "reasoning"

    async def execute(self, task: dict) -> dict:
        task_id = task["id"]
        title = task["title"]
        context = await self._load_context(title, task_id)
        plan = task.get("plan", {})

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
