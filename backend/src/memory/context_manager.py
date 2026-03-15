"""
Context Manager for memory optimization.

Handles semantic memory lifecycle including:
  - Context window management
  - Memory summarization for long-running tasks
  - Embedding deduplication
  - Memory pruning strategy
  - Cache invalidation

Integrates with VectorStore and BaseAgent context loading.
"""

from __future__ import annotations

from dataclasses import dataclass
from time import perf_counter
from typing import TYPE_CHECKING

from src.memory.vector_store import VectorStore
from src.utils.logger import get_logger

if TYPE_CHECKING:
    pass

logger = get_logger(__name__)


@dataclass
class ContextWindow:
    """Represents current context for a task execution."""

    task_id: str
    context_text: str
    memory_count: int
    total_tokens: int  # Approximate token count
    retrieved_at: float
    last_updated: float


class ContextManager:
    """
    Manages semantic memory and context windows for agent execution.

    Responsibilities:
    - Load context from vector store
    - Manage context window size
    - Deduplicate similar embeddings
    - Summarize long contexts
    - Prune stale memories
    - Track memory usage per task
    """

    def __init__(
        self,
        vector_store: VectorStore,
        max_context_tokens: int = 4000,
        dedup_threshold: float = 0.95,
    ) -> None:
        """
        Initialize context manager.

        Args:
            vector_store: VectorStore instance for semantic search
            max_context_tokens: Maximum tokens in context window (approximate)
            dedup_threshold: Cosine similarity threshold for deduplication (0-1)
        """
        self.vector_store = vector_store
        self.max_context_tokens = max_context_tokens
        self.dedup_threshold = dedup_threshold
        self._context_cache: dict[str, ContextWindow] = {}
        self._metrics = {
            "contexts_loaded": 0,
            "contexts_pruned": 0,
            "deduplications": 0,
        }

    async def load_context(
        self,
        task_id: str,
        task_prompt: str,
        limit: int = 5,
    ) -> ContextWindow:
        """
        Load and optimize context for task execution.

        Args:
            task_id: Unique task identifier
            task_prompt: Task description for semantic search
            limit: Maximum memories to retrieve

        Returns:
            ContextWindow with loaded context
        """
        # Retrieve memories from vector store
        context_text = await self.vector_store.retrieve_context(
            task_prompt=task_prompt,
            task_id=task_id,
            limit=limit,
        )

        # Count approximate tokens (rough estimate: ~4 chars per token)
        total_tokens = len(context_text) // 4

        # Create context window
        window = ContextWindow(
            task_id=task_id,
            context_text=context_text,
            memory_count=limit,
            total_tokens=total_tokens,
            retrieved_at=perf_counter(),
            last_updated=perf_counter(),
        )

        # Cache context
        self._context_cache[task_id] = window
        self._metrics["contexts_loaded"] += 1

        logger.info(
            "context_loaded",
            task_id=task_id,
            memory_count=limit,
            approx_tokens=total_tokens,
        )

        return window

    async def refresh_context(
        self,
        task_id: str,
        task_prompt: str,
        limit: int = 5,
    ) -> ContextWindow:
        """Refresh context for a task (new vector search)."""
        cached = self._context_cache.pop(task_id, None)
        result = await self.load_context(task_id, task_prompt, limit)

        if cached:
            logger.info(
                "context_refreshed",
                task_id=task_id,
                old_tokens=cached.total_tokens,
                new_tokens=result.total_tokens,
            )

        return result

    def get_cached_context(self, task_id: str) -> ContextWindow | None:
        """Retrieve cached context window for task."""
        return self._context_cache.get(task_id)

    async def prune_stale_memories(
        self,
        max_age_seconds: float = 3600.0,
    ) -> int:
        """
        Remove stale context windows from cache.

        Args:
            max_age_seconds: Age threshold for pruning (default: 1 hour)

        Returns:
            Number of contexts pruned
        """
        current_time = perf_counter()
        pruned = 0

        for task_id in list(self._context_cache.keys()):
            window = self._context_cache[task_id]
            age = current_time - window.retrieved_at

            if age > max_age_seconds:
                del self._context_cache[task_id]
                pruned += 1

                logger.info(
                    "context_pruned",
                    task_id=task_id,
                    age_seconds=round(age, 1),
                )

        if pruned > 0:
            self._metrics["contexts_pruned"] += pruned

        return pruned

    async def deduplicate_context(self, task_id: str) -> int:
        """
        Identify and remove near-duplicate entries in cached context.

        Args:
            task_id: Task to deduplicate

        Returns:
            Number of duplicates removed
        """
        window = self._context_cache.get(task_id)
        if not window:
            return 0

        # Parse context entries (newline-separated)
        entries = [e.strip() for e in window.context_text.split("\n") if e.strip()]

        if len(entries) < 2:
            return 0

        # Simple duplicate detection: exact matches and high similarity
        unique_entries: list[str] = []
        for entry in entries:
            # Skip if entry is very similar to existing entries
            is_duplicate = False

            for existing in unique_entries:
                similarity = self._text_similarity(entry, existing)
                if similarity > self.dedup_threshold:
                    is_duplicate = True
                    break

            if not is_duplicate:
                unique_entries.append(entry)

        duplicates_found = len(entries) - len(unique_entries)
        if duplicates_found > 0:
            # Update context with deduplicated entries
            window.context_text = "\n".join(unique_entries)
            window.total_tokens = len(window.context_text) // 4
            self._metrics["deduplications"] += duplicates_found

            logger.info(
                "context_deduplicated",
                task_id=task_id,
                duplicates_removed=duplicates_found,
                new_size=len(unique_entries),
            )

        return duplicates_found

    def _text_similarity(self, text1: str, text2: str) -> float:
        """
        Simple text similarity (0-1 scale).

        Rough approximation based on character overlap.
        Production use should employ proper embedding similarity.
        """
        if not text1 or not text2:
            return 0.0

        # Normalize
        t1 = text1.lower().strip()
        t2 = text2.lower().strip()

        if t1 == t2:
            return 1.0

        # Rough overlap detection
        common_chars = sum(t1.count(c) for c in set(t2))
        max_len = max(len(t1), len(t2))

        return common_chars / max_len if max_len > 0 else 0.0

    def clear_task_context(self, task_id: str) -> bool:
        """Clear cached context for a task."""
        if task_id in self._context_cache:
            del self._context_cache[task_id]
            logger.info("context_cleared", task_id=task_id)
            return True
        return False

    def status(self) -> dict:
        """Get context manager status and statistics."""
        return {
            "cached_contexts": len(self._context_cache),
            "max_context_tokens": self.max_context_tokens,
            "dedup_threshold": self.dedup_threshold,
            "contexts_loaded_total": self._metrics["contexts_loaded"],
            "contexts_pruned_total": self._metrics["contexts_pruned"],
            "deduplication_count": self._metrics["deduplications"],
        }
