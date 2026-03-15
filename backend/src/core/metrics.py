"""
System Metrics Collection

Phase-3: Centralized metrics aggregation from distributed components

Collects from:
- WorkerPool (worker count, task processing)
- TaskQueue (queue size, throughput)
- CircuitBreaker (breaker states, failures)
- ContextManager (memory usage)
- VectorStore (entry count)
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any

from src.config.config import get_settings
from src.providers.circuit_breaker.breaker_backend import (
    get_breaker_backend,
)
from src.utils.logger import logger


@dataclass
class SystemMetrics:
    """System-wide metrics snapshot"""

    timestamp: datetime = field(default_factory=datetime.utcnow)
    worker_count: int = 0
    queue_size: int = 0
    tasks_processed: int = 0
    tasks_failed: int = 0
    tasks_active: int = 0
    breaker_state: str = "closed"
    breaker_failures: int = 0
    vector_store_entries: int = 0
    memory_cache_size: int = 0
    uptime_seconds: float = 0.0
    redis_connected: bool = False
    version: str = "Phase-3"

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary"""
        return {
            "timestamp": self.timestamp.isoformat(),
            "worker_count": self.worker_count,
            "queue_size": self.queue_size,
            "tasks_processed": self.tasks_processed,
            "tasks_failed": self.tasks_failed,
            "tasks_active": self.tasks_active,
            "breaker_state": self.breaker_state,
            "breaker_failures": self.breaker_failures,
            "vector_store_entries": self.vector_store_entries,
            "memory_cache_size": self.memory_cache_size,
            "uptime_seconds": self.uptime_seconds,
            "redis_connected": self.redis_connected,
            "version": self.version,
        }


class MetricsCollector:
    """Collects system metrics from all components"""

    def __init__(self) -> None:
        self._start_time = datetime.utcnow()
        self._tasks_processed = 0
        self._tasks_failed = 0

    def record_task_processed(self) -> None:
        """Record successful task completion"""
        self._tasks_processed += 1

    def record_task_failed(self) -> None:
        """Record task failure"""
        self._tasks_failed += 1

    async def collect(
        self,
        worker_pool: Any | None = None,
        task_queue: Any | None = None,
        context_manager: Any | None = None,
        vector_store: Any | None = None,
    ) -> SystemMetrics:
        """
        Collect metrics from all components.
        
        Phase-3: Automatically gets BreakerBackend from settings.
        """

        metrics = SystemMetrics()
        metrics.tasks_processed = self._tasks_processed
        metrics.tasks_failed = self._tasks_failed
        metrics.uptime_seconds = (
            datetime.utcnow() - self._start_time
        ).total_seconds()

        # Collect from WorkerPool
        if worker_pool:
            try:
                metrics.worker_count = getattr(worker_pool, "worker_count", 0)
                metrics.tasks_active = getattr(worker_pool, "active_count", 0)
            except Exception as e:
                logger.debug(f"Failed to collect WorkerPool metrics: {e}")

        # Collect from TaskQueue
        if task_queue:
            try:
                metrics.queue_size = await task_queue.size()
                metrics.redis_connected = await task_queue.health_check()
            except Exception as e:
                logger.debug(f"Failed to collect TaskQueue metrics: {e}")

        # Collect from CircuitBreaker (Phase-3)
        try:
            settings = get_settings()
            backend = get_breaker_backend(settings.axon_breaker_backend)
            state = await backend.get_state("digitalocean_agent")
            metrics.breaker_state = state.value if hasattr(state, "value") else str(state)
            snapshot = await backend.get_snapshot("digitalocean_agent")
            metrics.breaker_failures = snapshot.failure_count
        except Exception as e:
            logger.debug(f"Failed to collect CircuitBreaker metrics: {e}")

        # Collect from ContextManager
        if context_manager:
            try:
                metrics.memory_cache_size = len(
                    getattr(context_manager, "_cache", {})
                )
            except Exception as e:
                logger.debug(f"Failed to collect ContextManager metrics: {e}")

        # Collect from VectorStore
        if vector_store:
            try:
                # Placeholder for actual vector store metrics
                metrics.vector_store_entries = 0
            except Exception as e:
                logger.debug(f"Failed to collect VectorStore metrics: {e}")

        return metrics
