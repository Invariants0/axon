"""
Structured exceptions for AXON pipeline execution.

These exceptions provide clear error propagation through the agent pipeline
and enable the evolution engine to trigger skill generation when needed.
"""


class AgentExecutionError(Exception):
    """Raised when an agent fails to execute."""
    
    def __init__(self, agent_name: str, message: str, original_error: Exception | None = None):
        self.agent_name = agent_name
        self.original_error = original_error
        super().__init__(f"Agent '{agent_name}' failed: {message}")


class SkillExecutionError(Exception):
    """Raised when a skill fails to execute."""
    
    def __init__(self, skill_name: str, message: str, original_error: Exception | None = None):
        self.skill_name = skill_name
        self.original_error = original_error
        super().__init__(f"Skill '{skill_name}' failed: {message}")


class PipelineStageError(Exception):
    """Raised when a pipeline stage fails."""
    
    def __init__(self, stage: str, task_id: str, message: str, original_error: Exception | None = None):
        self.stage = stage
        self.task_id = task_id
        self.original_error = original_error
        super().__init__(f"Pipeline stage '{stage}' failed for task {task_id}: {message}")


class LLMProviderError(Exception):
    """Raised when LLM provider fails."""
    
    def __init__(self, provider: str, message: str, original_error: Exception | None = None):
        self.provider = provider
        self.original_error = original_error
        super().__init__(f"LLM provider '{provider}' failed: {message}")
