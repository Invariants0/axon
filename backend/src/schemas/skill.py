from pydantic import BaseModel


class SkillSchema(BaseModel):
    name: str
