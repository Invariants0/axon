class SkillTemplate:
    name = "template"

    async def run(self, payload: dict) -> dict:
        return {"name": self.name, "payload": payload}
