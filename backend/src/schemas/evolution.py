from pydantic import BaseModel


class EvolutionStatus(BaseModel):
    status: str
    generated_skills: int
    failed_tasks: int
    last_run: str | None = None
