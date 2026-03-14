import json
import os
from typing import Any

from gradient import AsyncGradient
from gradient_adk import entrypoint
from langgraph.graph import END, StateGraph


class BuilderState(dict):
    prompt: str
    context: dict[str, Any]
    build: dict[str, Any]


async def generate_solution(state: BuilderState) -> BuilderState:
    client = AsyncGradient(
        inference_endpoint="https://inference.do-ai.run",
        model_access_key=os.environ["GRADIENT_MODEL_ACCESS_KEY"],
    )
    
    prompt = state.get("prompt", "")
    context = state.get("context", {})
    
    system_prompt = "You are a builder agent. Generate complete solutions based on plans and research."
    user_prompt = f"Build: {prompt}\n\nContext: {json.dumps(context)}\n\nGenerate the final solution."
    
    response = await client.chat.completions.create(
        model=os.environ.get("GRADIENT_MODEL", "openai-gpt-oss-120b"),
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.7,
    )
    
    content = response.choices[0].message.content
    
    build = {
        "solution": content,
        "implementation": content,
        "status": "completed",
    }
    
    state["build"] = build
    return state


def build_graph() -> StateGraph:
    workflow = StateGraph(BuilderState)
    workflow.add_node("build", generate_solution)
    workflow.set_entry_point("build")
    workflow.add_edge("build", END)
    return workflow.compile()


graph = build_graph()


@entrypoint
async def main(input: dict, context: dict) -> dict:
    prompt = input.get("prompt", "")
    task_context = input.get("context", {})
    
    state = BuilderState(prompt=prompt, context=task_context, build={})
    result = await graph.ainvoke(state)
    
    return {
        "response": json.dumps(result.get("build", {})),
        "metadata": {
            "agent": "builder",
            "version": "1.0.0",
        },
    }
