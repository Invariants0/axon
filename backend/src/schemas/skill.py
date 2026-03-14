from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class SkillResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str | None = None
    name: str
    description: str
    version: str = "1.0.0"
    parameters: dict[str, Any] = {}
    created_at: datetime | None = None
    updated_at: datetime | None = None


class SkillListResponse(BaseModel):
    items: list[SkillResponse]
