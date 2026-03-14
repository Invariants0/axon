import pytest

from src.core.agent_orchestrator import AgentOrchestrator
from src.core.event_bus import EventBus
from src.db.models import Task


class FakeLLM:
    async def complete(self, prompt: str) -> str:
        return f"LLM:{prompt[:30]}"


class FakeSkills:
    async def execute(self, name: str, payload: dict | None = None) -> dict:
        payload = payload or {}
        if name == "planning":
            return {"skill": name, "output": {"steps": [{"step": 1, "description": "a"}]}}
        if name == "web_search":
            return {"skill": name, "output": {"notes": ["n1"]}}
        if name == "reasoning":
            return {"skill": name, "output": {"confidence": 0.8}}
        if name == "coding":
            return {"skill": name, "output": {"summary": "done"}}
        return {"skill": name, "output": payload}


class FakeMemory:
    async def retrieve_context(self, task_prompt: str, task_id: str | None = None, limit: int = 5) -> str:
        return "context"

    async def add_embedding(self, content: str, memory_type: str, task_id: str | None = None, metadata: dict | None = None):
        return "mem-1"


class FakeSession:
    def __init__(self):
        self.items = []

    def add(self, item):
        self.items.append(item)


@pytest.mark.asyncio
async def test_agent_orchestrator_pipeline_runs():
    bus = EventBus()
    orchestrator = AgentOrchestrator(
        llm_service=FakeLLM(),
        skill_executor=FakeSkills(),
        vector_store=FakeMemory(),
        event_bus=bus,
    )
    task = Task(id="task-1", title="Build API", description="Create endpoints", status="running", result="")
    session = FakeSession()

    result = await orchestrator.run_pipeline(task, session)

    assert "planning" in result
    assert "builder" in result
    assert len(session.items) >= 8
