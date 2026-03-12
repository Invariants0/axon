from pydantic import BaseModel


class EvolutionSchema(BaseModel):
    status: str = "idle"
