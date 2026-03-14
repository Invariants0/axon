from __future__ import annotations

import asyncio
from uuid import uuid4

import chromadb

from src.config.config import get_settings
from src.memory.embeddings import embed


class VectorStore:
    def __init__(self) -> None:
        settings = get_settings()
        try:
            self.client = chromadb.PersistentClient(path=settings.vector_db_path)
        except Exception:
            # Keep tests and local runs functional even when persistent state is corrupted.
            self.client = chromadb.EphemeralClient()
        self.collection = self.client.get_or_create_collection(name="axon_memory")

    async def add_embedding(
        self,
        content: str,
        memory_type: str,
        task_id: str | None = None,
        metadata: dict | None = None,
    ) -> str:
        memory_id = str(uuid4())
        vector = await embed(content)
        merged_metadata = {
            "memory_type": memory_type,
            "task_id": task_id or "",
            **(metadata or {}),
        }

        await asyncio.to_thread(
            self.collection.add,
            ids=[memory_id],
            embeddings=[vector],
            documents=[content],
            metadatas=[merged_metadata],
        )
        return memory_id

    async def similarity_search(
        self,
        query: str,
        limit: int = 5,
        task_id: str | None = None,
    ) -> list[dict]:
        query_vector = await embed(query)
        where_filter = {"task_id": task_id} if task_id else None
        result = await asyncio.to_thread(
            self.collection.query,
            query_embeddings=[query_vector],
            n_results=limit,
            where=where_filter,
        )

        ids = (result.get("ids") or [[]])[0]
        docs = (result.get("documents") or [[]])[0]
        metadatas = (result.get("metadatas") or [[]])[0]
        distances = (result.get("distances") or [[]])[0]

        output: list[dict] = []
        for idx, memory_id in enumerate(ids):
            output.append(
                {
                    "id": memory_id,
                    "content": docs[idx] if idx < len(docs) else "",
                    "metadata": metadatas[idx] if idx < len(metadatas) else {},
                    "distance": distances[idx] if idx < len(distances) else None,
                }
            )
        return output

    async def retrieve_context(
        self,
        task_prompt: str,
        task_id: str | None = None,
        limit: int = 5,
    ) -> str:
        memories = await self.similarity_search(task_prompt, limit=limit, task_id=task_id)
        context_parts = [item["content"] for item in memories if item.get("content")]
        return "\n".join(context_parts)
