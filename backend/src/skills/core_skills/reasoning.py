SKILL = {
    "name": "reasoning",
    "description": "Evaluate options and tradeoffs for a plan",
    "parameters": {
        "plan": {"type": "object", "required": True},
        "context": {"type": "string", "required": False},
    },
    "version": "1.0.0",
}


async def execute(payload: dict) -> dict:
    plan = payload.get("plan", {})
    steps = plan.get("steps", []) if isinstance(plan, dict) else []
    score = min(1.0, 0.4 + 0.1 * len(steps))
    return {
        "confidence": round(score, 2),
        "risks": [
            "Insufficient external context",
            "Ambiguous acceptance criteria",
        ],
        "recommendation": "Proceed with iterative validation",
    }
