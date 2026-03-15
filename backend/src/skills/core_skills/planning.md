# Planning Skill

## Overview
Breaks down a task into executable steps.

## Input Parameters
- **task** (string, required): The task to break down
- **max_steps** (integer, optional): Maximum number of steps to generate (default: 4)

## Output
```json
{
  "task": "original task description",
  "steps": [
    {
      "step": 1,
      "description": "Clarify objective and constraints"
    },
    {
      "step": 2,
      "description": "Collect required context and references"
    }
  ]
}
```

## Usage Example
```python
result = await skill_executor.execute("planning", {
    "task": "Build a REST API",
    "max_steps": 5
})
```

## Used By
- PlanningAgent (first stage of agent pipeline)
