SKILL = {
    "name": "coding",
    "description": "Generate implementation scaffolding based on requirements",
    "parameters": {
        "task": {"type": "string", "required": True},
        "plan": {"type": "object", "required": False},
    },
    "version": "1.0.0",
}


async def execute(payload: dict) -> dict:
    task = payload.get("task", "")
    return {
        "summary": f"Implementation draft prepared for: {task}",
        "artifacts": [
            {"type": "markdown", "name": "solution.md"},
            {"type": "json", "name": "result.json"},
        ],
    }
