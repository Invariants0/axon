"""
Qdrant Vector Store Adapter

Implements the same interface as ChromaDB VectorStore but uses Qdrant Cloud for storage.
Provides cloud-native vector database support with high availability and scalability.

Configuration via environment variables:
- VECTOR_DB_PROVIDER: "qdrant" (to enable)
- QDRANT_URL: Qdrant Cloud cluster URL
- QDRANT_API_KEY: Qdrant Cloud API key
- QDRANT_COLLECTION: Collection name (default: "axon_memory")
- EMBEDDING_DIMENSION: Vector dimension (default: 384 for all-MiniLM-L6-v2)
"""

from __future__ import annotations

import asyncio
from uuid import uuid4

from qdrant_client import QdrantClient
from qdrant_client.http.models import (
    Distance,
    PointStruct,
    VectorParams,
    KeywordIndexParams,
    KeywordIndexType,
)
from src.config.config import get_settings
from src.memory.embeddings import embed


class QdrantStore:
    """Qdrant Cloud vector store adapter - compatible with VectorStore interface."""

    def __init__(self) -> None:
        """Initialize Qdrant client and create collection if needed."""
        settings = get_settings()
        
        # Get Qdrant configuration
        qdrant_url = settings.qdrant_url
        qdrant_api_key = settings.qdrant_api_key
        collection_name = settings.qdrant_collection
        embedding_dimension = settings.embedding_dimension
        
        if not qdrant_url or not qdrant_api_key:
            raise ValueError(
                "Qdrant configuration missing. Set QDRANT_URL and QDRANT_API_KEY environment variables."
            )
        
        # Initialize Qdrant client with HTTPS
        self.client = QdrantClient(
            url=qdrant_url, 
            api_key=qdrant_api_key,
            prefer_grpc=False,
            timeout=30
        )
        self.collection_name = collection_name
        self.embedding_dimension = embedding_dimension
        
        # Ensure collection exists
        self._ensure_collection_exists()

    def _ensure_collection_exists(self) -> None:
        """Create collection if it doesn't exist and set up indexes."""
        try:
            # Try to get collection info
            self.client.get_collection(self.collection_name)
        except Exception:
            # Collection doesn't exist, create it
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=VectorParams(
                    size=self.embedding_dimension,
                    distance=Distance.COSINE,
                ),
            )
        
        # Ensure index on task_id for filtering
        try:
            self.client.create_payload_index(
                collection_name=self.collection_name,
                field_name="task_id",
                field_schema=KeywordIndexParams(type=KeywordIndexType.KEYWORD),
            )
        except Exception as exc:
            # Index might already exist; ignore that case but surface other errors
            if "already exists" in str(exc).lower():
                return
            raise

    async def add_embedding(
        self,
        content: str,
        memory_type: str,
        task_id: str | None = None,
        metadata: dict | None = None,
    ) -> str:
        """
        Add an embedding to the Qdrant collection.
        
        Compatible with ChromaDB VectorStore interface.
        
        Args:
            content: Text content to embed and store
            memory_type: Type of memory (e.g., "context", "result", "error")
            task_id: Optional task identifier for filtering
            metadata: Additional metadata to store
            
        Returns:
            Memory ID (UUID string)
        """
        memory_id = str(uuid4())
        
        # Generate embedding
        vector = await embed(content)
        
        # Prepare payload (metadata)
        merged_metadata = {
            "memory_type": memory_type,
            "task_id": task_id or "",
            "content": content,  # Store content in payload for retrieval
            **(metadata or {}),
        }
        
        # Create point and upsert to Qdrant
        point = PointStruct(
            id=hash(memory_id) & 0x7FFFFFFF,  # Convert UUID to positive integer
            vector=vector,
            payload=merged_metadata,
        )
        
        # Run in thread pool to avoid blocking
        await asyncio.to_thread(
            self.client.upsert,
            collection_name=self.collection_name,
            points=[point],
        )
        
        return memory_id

    async def similarity_search(
        self,
        query: str,
        limit: int = 5,
        task_id: str | None = None,
    ) -> list[dict]:
        """
        Perform similarity search in Qdrant.
        
        Compatible with ChromaDB VectorStore interface.
        
        Args:
            query: Text query to search
            limit: Maximum number of results
            task_id: Optional task ID for filtering
            
        Returns:
            List of search results with id, content, metadata, distance
        """
        # Generate query embedding
        query_vector = await embed(query)
        
        # Prepare filter if task_id provided
        query_filter = None
        if task_id:
            from qdrant_client.http.models import Filter, FieldCondition, MatchValue
            
            query_filter = Filter(
                must=[
                    FieldCondition(
                        key="task_id",
                        match=MatchValue(value=task_id),
                    )
                ]
            )
        
        # Search in Qdrant
        search_result = await asyncio.to_thread(
            self.client.query_points,
            collection_name=self.collection_name,
            query=query_vector,
            limit=limit,
            query_filter=query_filter,
        )
        
        # Format results to match ChromaDB interface
        output: list[dict] = []
        for scored_point in search_result.points:
            output.append(
                {
                    "id": str(scored_point.id),
                    "content": scored_point.payload.get("content", ""),
                    "metadata": {
                        k: v
                        for k, v in scored_point.payload.items()
                        if k != "content"
                    },
                    "distance": 1 - scored_point.score,  # Convert similarity to distance
                }
            )
        
        return output

    async def retrieve_context(
        self,
        task_prompt: str,
        task_id: str | None = None,
        limit: int = 5,
    ) -> str:
        """
        Retrieve context as concatenated string.
        
        Compatible with ChromaDB VectorStore interface.
        
        Args:
            task_prompt: Task prompt for semantic search
            task_id: Optional task ID for filtering
            limit: Maximum memories to retrieve
            
        Returns:
            Concatenated context string
        """
        memories = await self.similarity_search(
            task_prompt, limit=limit, task_id=task_id
        )
        context_parts = [item["content"] for item in memories if item.get("content")]
        return "\n".join(context_parts)

    async def delete(self, memory_id: str) -> None:
        """
        Delete a memory by ID.
        
        Args:
            memory_id: Memory ID to delete
        """
        point_id = hash(memory_id) & 0x7FFFFFFF
        await asyncio.to_thread(
            self.client.delete,
            collection_name=self.collection_name,
            points_selector=point_id,
        )

    async def get_collection_stats(self) -> dict:
        """
        Get collection statistics for monitoring.
        
        Returns:
            Dictionary with collection metadata and stats
        """
        collection_info = await asyncio.to_thread(
            self.client.get_collection,
            collection_name=self.collection_name,
        )
        
        return {
            "collection_name": self.collection_name,
            "vector_count": collection_info.points_count,
            "vector_dimension": self.embedding_dimension,
            "distance_metric": "cosine",
        }
