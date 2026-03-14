import json
import os
from typing import Any

from gradient import AsyncGradient
from gradient_adk import entrypoint
from langgraph.graph import END, StateGraph


class ResearchState(dict):
    prompt: str
    context: dict[str, Any]
    research: dict[str, Any]


async def conduct_research(state: ResearchState) -> ResearchState:
    client = AsyncGradient(
        inference_endpoint="https://inference.do-ai.run",
        model_access_key=os.environ["GRADIENT_MODEL_ACCESS_KEY"],
    )
    
    prompt = state.get("prompt", "")
    context = state.get("context", {})
    
    kb_uuid = os.environ.get("DIGITALOCEAN_KB_UUID")
    kb_context = ""
    
    if kb_uuid:
        try:
            kb_results = await client.retrieve.documents(
                knowledge_base_id=kb_uuid,
                query=prompt,
                limit=5,
            )
            kb_docs = [doc.content for doc in kb_results.documents]
            kb_context = f"\n\nKnowledge Base Context:\n{chr(10).join(kb_docs)}"
        except Exception:
            pass
    
    system_prompt = "You are a research agent. Gather and synthesize information relevant to the task."
    user_prompt = f"Research: {prompt}\n\nContext: {json.dumps(context)}{kb_context}\n\nProvide comprehensive research notes."
    
    response = await client.chat.completions.create(
        model=os.environ.get("GRADIENT_MODEL", "openai-gpt-oss-120b"),
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.5,
    )
    
    content = response.choices[0].message.content
    
    research = {
        "notes": content,
        "sources": "synthesized",
        "summary": content[:500],
    }
    
    state["research"] = research
    return state


def build_graph() -> StateGraph:
    workflow = StateGraph(ResearchState)
    workflow.add_node("research", conduct_research)
    workflow.set_entry_point("research")
    workflow.add_edge("research", END)
    return workflow.compile()


graph = build_graph()


@entrypoint
async def main(input: dict, context: dict) -> dict:
    prompt = input.get("prompt", "")
    task_context = input.get("context", {})
    
    state = ResearchState(prompt=prompt, context=task_context, research={})
    result = await graph.ainvoke(state)
    
    return {
        "response": json.dumps(result.get("research", {})),
        "metadata": {
            "agent": "research",
            "version": "1.0.0",
        },
    }
