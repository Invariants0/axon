class GradientClient:
    async def health(self) -> dict:
        return {"provider": "gradient", "status": "placeholder"}
