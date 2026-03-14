import json
import os
from typing import Any

from gradient import AsyncGradient
from gradient_adk import entrypoint
from langgraph.graph import END, StateGraph


class ReasoningState(dict):
    prompt: str
    context: dict[str, Any]
    reasoning: dict[str, Any]


async def evaluate_strategy(state: ReasoningState) -> ReasoningState:
    client = AsyncGradient(
        inference_endpoint="https://inference.do-ai.run",
        model_access_key=os.environ["GRADIENT_MODEL_ACCESS_KEY"],
    )
    
    prompt = state.get("prompt", "")
    context = state.get("context", {})
    
    system_prompt = "You are a reasoning agent. Evaluate strategies and provide logical analysis."
    user_prompt = f"Evaluate: {prompt}\n\nContext: {json.dumps(context)}\n\nProvide detailed reasoning and rationale."
    
    response = await client.chat.completions.create(
        model=os.environ.get("GRADIENT_MODEL", "openai-gpt-oss-120b"),
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.3,
    )
    
    content = response.choices[0].message.content
    
    reasoning = {
        "analysis": content,
        "rationale": content[:300],
        "confidence": "high",
    }
    
    state["reasoning"] = reasoning
    return state


def build_graph() -> StateGraph:
    workflow = StateGraph(ReasoningState)
    workflow.add_node("evaluate", evaluate_strategy)
    workflow.set_entry_point("evaluate")
    workflow.add_edge("evaluate", END)
    return workflow.compile()


graph = build_graph()


@entrypoint
async def main(input: dict, context: dict) -> dict:
    prompt = input.get("prompt", "")
    task_context = input.get("context", {})
    
    state = ReasoningState(prompt=prompt, context=task_context, reasoning={})
    result = await graph.ainvoke(state)
    
    return {
        "response": json.dumps(result.get("reasoning", {})),
        "metadata": {
            "agent": "reasoning",
            "version": "1.0.0",
        },
    }
