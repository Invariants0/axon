import json
import os
from typing import Any

from gradient import AsyncGradient
from gradient_adk import entrypoint
from langgraph.graph import END, StateGraph


class PlannerState(dict):
    prompt: str
    context: dict[str, Any]
    plan: dict[str, Any]


async def analyze_task(state: PlannerState) -> PlannerState:
    client = AsyncGradient(
        inference_endpoint="https://inference.do-ai.run",
        model_access_key=os.environ["GRADIENT_MODEL_ACCESS_KEY"],
    )
    
    prompt = state.get("prompt", "")
    context = state.get("context", {})
    
    system_prompt = "You are a task planning agent. Break down tasks into actionable steps."
    user_prompt = f"Task: {prompt}\n\nContext: {json.dumps(context)}\n\nCreate a detailed plan with steps."
    
    response = await client.chat.completions.create(
        model=os.environ.get("GRADIENT_MODEL", "openai-gpt-oss-120b"),
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.7,
    )
    
    content = response.choices[0].message.content
    
    try:
        plan = json.loads(content)
    except json.JSONDecodeError:
        plan = {
            "steps": content.split("\n"),
            "raw": content,
        }
    
    state["plan"] = plan
    return state


def build_graph() -> StateGraph:
    workflow = StateGraph(PlannerState)
    workflow.add_node("analyze", analyze_task)
    workflow.set_entry_point("analyze")
    workflow.add_edge("analyze", END)
    return workflow.compile()


graph = build_graph()


@entrypoint
async def main(input: dict, context: dict) -> dict:
    prompt = input.get("prompt", "")
    task_context = input.get("context", {})
    
    state = PlannerState(prompt=prompt, context=task_context, plan={})
    result = await graph.ainvoke(state)
    
    return {
        "response": json.dumps(result.get("plan", {})),
        "metadata": {
            "agent": "planner",
            "version": "1.0.0",
        },
    }
