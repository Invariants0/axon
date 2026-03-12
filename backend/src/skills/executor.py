class SkillExecutor:
    async def execute(self, name: str, payload: dict | None = None) -> dict:
        return {"skill": name, "payload": payload or {}, "status": "placeholder"}
