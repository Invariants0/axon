from __future__ import annotations

from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncSession

from src.db.models import Artifact


class ArtifactStore:
    def __init__(self, base_path: str = "./artifacts") -> None:
        self.base_path = Path(base_path)
        self.base_path.mkdir(parents=True, exist_ok=True)

    async def save(
        self,
        session: AsyncSession,
        task_id: str,
        artifact_name: str,
        content: bytes,
        content_type: str = "application/octet-stream",
    ) -> Artifact:
        target = self.base_path / task_id
        target.mkdir(parents=True, exist_ok=True)
        file_path = target / artifact_name
        file_path.write_bytes(content)

        artifact = Artifact(
            task_id=task_id,
            name=artifact_name,
            content_type=content_type,
            storage_path=str(file_path),
            metadata_json={},
        )
        session.add(artifact)
        await session.flush()
        return artifact
