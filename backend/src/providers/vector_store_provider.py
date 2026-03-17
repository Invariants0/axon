"""
Vector Store Provider Factory

Dynamically selects between Chroma and Qdrant vector database backends
based on configuration. Provides unified interface for vector storage operations.

Supported providers:
- "chroma" (default): Local/persistent Chroma vector database
- "qdrant": Qdrant Cloud remote vector database

Configuration via VECTOR_DB_PROVIDER environment variable.
"""

from __future__ import annotations

from src.config.config import get_settings


async def get_vector_store():
    """
    Factory function to create appropriate vector store instance.
    
    Returns:
        VectorStore or QdrantStore instance based on VECTOR_DB_PROVIDER config
        
    Raises:
        ValueError: If provider is misconfigured
    """
    settings = get_settings()
    provider = settings.vector_db_provider.lower()
    
    if provider == "qdrant":
        from src.memory.qdrant_store import QdrantStore
        return QdrantStore()
    elif provider == "chroma" or provider == "":
        from src.memory.vector_store import VectorStore
        return VectorStore()
    else:
        raise ValueError(
            f"Unknown vector database provider: {provider}. "
            f"Supported: 'chroma' (default), 'qdrant'"
        )


def create_vector_store():
    """
    Synchronous factory for creating vector store instance.
    
    Use this when you need to create a vector store outside async context.
    
    Returns:
        VectorStore or QdrantStore instance
    """
    settings = get_settings()
    provider = settings.vector_db_provider.lower()
    
    if provider == "qdrant":
        from src.memory.qdrant_store import QdrantStore
        return QdrantStore()
    elif provider == "chroma" or provider == "":
        from src.memory.vector_store import VectorStore
        return VectorStore()
    else:
        raise ValueError(
            f"Unknown vector database provider: {provider}. "
            f"Supported: 'chroma' (default), 'qdrant'"
        )
