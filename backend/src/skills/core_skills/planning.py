SKILL = {
    "name": "planning",
    "description": "Break a task into executable steps",
    "parameters": {
        "task": {"type": "string", "required": True},
        "max_steps": {"type": "integer", "required": False},
    },
    "version": "1.0.0",
}


async def execute(payload: dict) -> dict:
    task = payload.get("task", "")
    max_steps = int(payload.get("max_steps", 4))
    seed_steps = [
        "Clarify objective and constraints",
        "Collect required context and references",
        "Decide implementation strategy",
        "Implement and validate output",
        "Summarize and deliver results",
    ]
    steps = seed_steps[: max(1, min(max_steps, len(seed_steps)))]
    return {
        "task": task,
        "steps": [{"step": i + 1, "description": s} for i, s in enumerate(steps)],
    }
