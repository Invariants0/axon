from __future__ import annotations

from pathlib import Path
import os
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from src.db.models import Artifact

from src.storage.s3_store import S3Store


class ArtifactStore:
    def __init__(self, base_path: str = "./artifacts") -> None:
        self.base_path = Path(base_path)
        self.base_path.mkdir(parents=True, exist_ok=True)

        # Determine provider based on env vars
        provider = os.getenv("STORAGE_PROVIDER") or ("s3" if os.getenv("DO_SPACES_URL") else "local")
        self.provider = provider.lower()
        self.s3: Optional[S3Store] = None
        if self.provider in ("s3", "do_spaces"):
            try:
                self.s3 = S3Store()
            except Exception:
                # fall back to local if misconfigured
                self.s3 = None
                self.provider = "local"

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

        storage_path = str(file_path)

        # Upload to S3-compatible object storage when configured
        if self.provider in ("s3", "do_spaces") and self.s3:
            key = f"{task_id}/{artifact_name}"
            try:
                url = await self.s3.upload_bytes(key, content, content_type=content_type)
                storage_path = url
            except Exception:
                # ignore upload errors and leave local path
                pass

        artifact = Artifact(
            task_id=task_id,
            name=artifact_name,
            content_type=content_type,
            storage_path=storage_path,
            metadata_json={"storage_provider": self.provider},
        )
        session.add(artifact)
        await session.flush()
        return artifact
