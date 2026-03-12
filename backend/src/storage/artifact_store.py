class ArtifactStore:
    async def save(self, artifact_id: str, content: bytes) -> None:
        _ = (artifact_id, content)
        return None
