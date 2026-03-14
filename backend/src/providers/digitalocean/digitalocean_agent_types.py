from typing import Any

from pydantic import BaseModel


class AgentRequest(BaseModel):
    prompt: str
    context: dict[str, Any] | None = None


class AgentResponse(BaseModel):
    response: str
    metadata: dict[str, Any] | None = None
    trace_id: str | None = None
