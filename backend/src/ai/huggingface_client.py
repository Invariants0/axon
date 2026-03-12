class HuggingFaceClient:
    async def health(self) -> dict:
        return {"provider": "huggingface", "status": "placeholder"}
