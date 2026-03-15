"""
Agent Execution Graph representation.

Models the multi-agent pipeline as a directed acyclic graph (DAG) to enable
future dynamic pipelines while preserving current sequential execution.

Supports:
  - Pipeline topology description
  - Agent stage relationships
  - Conditional branching (preparation for future)
  - Execution order specification
  - Backward compatibility with current 4-stage pipeline

Current Pipeline (v1):
  Planning → Research → Reasoning → Builder
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import TYPE_CHECKING

from src.utils.logger import get_logger

if TYPE_CHECKING:
    pass

logger = get_logger(__name__)


class AgentStage(str, Enum):
    """Agent pipeline stages."""

    PLANNING = "planning"
    RESEARCH = "research"
    REASONING = "reasoning"
    BUILDER = "builder"


@dataclass
class StageNode:
    """Represents a single stage in the execution graph."""

    name: AgentStage
    description: str = ""
    dependencies: list[AgentStage] = field(default_factory=list)
    parallel_with: list[AgentStage] = field(default_factory=list)
    retry_on_failure: bool = True
    timeout_seconds: float = 300.0

    def to_dict(self) -> dict:
        """Serialize to dictionary."""
        return {
            "name": self.name.value,
            "description": self.description,
            "dependencies": [s.value for s in self.dependencies],
            "parallel_with": [s.value for s in self.parallel_with],
            "retry_on_failure": self.retry_on_failure,
            "timeout_seconds": self.timeout_seconds,
        }


class AgentExecutionGraph:
    """
    Represents the multi-agent execution pipeline as a directed graph.

    Enforces execution order, manages dependencies, and supports future
    extensions for conditional branching and dynamic agent routing.
    """

    def __init__(self) -> None:
        """Initialize execution graph with default 4-stage pipeline."""
        self._stages: dict[AgentStage, StageNode] = {}
        self._execution_order: list[AgentStage] = []
        self._initialize_default_pipeline()

    def _initialize_default_pipeline(self) -> None:
        """Initialize the current 4-stage sequential pipeline."""
        # Planning stage: decompose task into actionable steps
        self._add_stage(
            AgentStage.PLANNING,
            description="Plan task decomposition and execution strategy",
        )

        # Research stage: depends on planning
        self._add_stage(
            AgentStage.RESEARCH,
            description="Gather context and relevant information",
            dependencies=[AgentStage.PLANNING],
        )

        # Reasoning stage: depends on research
        self._add_stage(
            AgentStage.REASONING,
            description="Evaluate strategies and reasoning paths",
            dependencies=[AgentStage.RESEARCH],
        )

        # Builder stage: depends on reasoning
        self._add_stage(
            AgentStage.BUILDER,
            description="Generate and implement solutions",
            dependencies=[AgentStage.REASONING],
        )

        self._execution_order = [
            AgentStage.PLANNING,
            AgentStage.RESEARCH,
            AgentStage.REASONING,
            AgentStage.BUILDER,
        ]

    def _add_stage(
        self,
        stage: AgentStage,
        description: str = "",
        dependencies: list[AgentStage] | None = None,
        parallel_with: list[AgentStage] | None = None,
    ) -> None:
        """Add a stage to the graph."""
        node = StageNode(
            name=stage,
            description=description,
            dependencies=dependencies or [],
            parallel_with=parallel_with or [],
        )
        self._stages[stage] = node

    def get_execution_order(self) -> list[AgentStage]:
        """Get the sequential execution order of agents."""
        return list(self._execution_order)

    def get_stage_info(self, stage: AgentStage) -> StageNode | None:
        """Get information about a specific stage."""
        return self._stages.get(stage)

    def get_all_stages(self) -> list[StageNode]:
        """Get all stages in the graph."""
        return list(self._stages.values())

    def get_next_stages(self, current_stage: AgentStage) -> list[AgentStage]:
        """Get stages that should execute after the current stage.
        
        In the current sequential pipeline, returns the single next stage.
        Future implementations may return multiple stages for parallel execution.
        """
        current_idx = self._execution_order.index(current_stage)
        if current_idx + 1 < len(self._execution_order):
            return [self._execution_order[current_idx + 1]]
        return []

    def has_dependencies(self, stage: AgentStage) -> bool:
        """Check if stage has task dependencies."""
        node = self._stages.get(stage)
        return bool(node and node.dependencies)

    def get_dependencies(self, stage: AgentStage) -> list[AgentStage]:
        """Get stages that must complete before this stage."""
        node = self._stages.get(stage)
        return node.dependencies if node else []

    def supports_parallel_execution(self) -> bool:
        """Check if graph allows parallel stage execution."""
        # Current implementation is sequential only
        for node in self._stages.values():
            if node.parallel_with:
                return True
        return False

    def to_dict(self) -> dict:
        """Serialize graph to dictionary format."""
        return {
            "execution_order": [s.value for s in self._execution_order],
            "stages": {
                s.value: node.to_dict() for s, node in self._stages.items()
            },
            "supports_parallel": self.supports_parallel_execution(),
        }

    def validate_topology(self) -> tuple[bool, list[str]]:
        """
        Validate graph topology for consistency.

        Returns:
            (is_valid, error_messages) tuple
        """
        errors: list[str] = []

        # Check for cycles (should not exist in DAG)
        visited: set[AgentStage] = set()
        rec_stack: set[AgentStage] = set()

        def has_cycle(stage: AgentStage) -> bool:
            visited.add(stage)
            rec_stack.add(stage)

            node = self._stages.get(stage)
            if node:
                for dep in node.dependencies:
                    if dep not in visited:
                        if has_cycle(dep):
                            return True
                    elif dep in rec_stack:
                        return True

            rec_stack.remove(stage)
            return False

        for stage in self._stages:
            if stage not in visited:
                if has_cycle(stage):
                    errors.append(f"Cycle detected involving stage {stage.value}")

        # Check that all dependencies reference existing stages
        for stage, node in self._stages.items():
            for dep in node.dependencies:
                if dep not in self._stages:
                    errors.append(
                        f"Stage {stage.value} depends on undefined stage {dep.value}"
                    )

        return len(errors) == 0, errors

    def log_topology(self) -> None:
        """Log graph structure for debugging."""
        logger.info("agent_execution_graph_topology")
        for stage in self._execution_order:
            node = self._stages[stage]
            deps_str = ", ".join(d.value for d in node.dependencies) or "none"
            logger.info(
                f"  {stage.value} ← {deps_str}",
                stage=stage.value,
                dependencies=deps_str,
                description=node.description,
            )
