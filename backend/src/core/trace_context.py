"""Global Trace Context Management.

Provides trace_id propagation across the entire system.
Each task has a unique trace_id that flows through all components.
"""

from __future__ import annotations

import contextvars
import uuid
from datetime import datetime

_trace_id: contextvars.ContextVar[str] = contextvars.ContextVar(
    "trace_id", default=""
)
_task_id: contextvars.ContextVar[str] = contextvars.ContextVar(
    "task_id", default=""
)


class TraceContext:
    """Context-aware trace management."""

    @staticmethod
    def generate_trace_id() -> str:
        """Generate a new trace ID."""
        return str(uuid.uuid4())

    @staticmethod
    def set_trace_id(trace_id: str) -> None:
        """Set current trace ID in context."""
        _trace_id.set(trace_id)

    @staticmethod
    def get_trace_id() -> str:
        """Get current trace ID (or generate new if not set)."""
        trace_id = _trace_id.get()
        if not trace_id:
            trace_id = TraceContext.generate_trace_id()
            _trace_id.set(trace_id)
        return trace_id

    @staticmethod
    def set_task_id(task_id: str) -> None:
        """Set current task ID in context."""
        _task_id.set(task_id)

    @staticmethod
    def get_task_id() -> str:
        """Get current task ID."""
        return _task_id.get()

    @staticmethod
    def get_timestamp() -> str:
        """Get ISO 8601 timestamp."""
        return datetime.utcnow().isoformat() + "Z"

    @staticmethod
    def create_event(
        event_name: str,
        data: dict | None = None,
        trace_id: str | None = None,
        task_id: str | None = None,
    ) -> dict:
        """
        Create a properly structured event.
        
        Args:
            event_name: Event type (e.g., "task.started")
            data: Event payload
            trace_id: Override trace ID (optional)
            task_id: Override task ID (optional)
        
        Returns:
            Structured event dict
        """
        return {
            "event": event_name,
            "trace_id": trace_id or TraceContext.get_trace_id(),
            "task_id": task_id or TraceContext.get_task_id(),
            "timestamp": TraceContext.get_timestamp(),
            "data": data or {},
        }
