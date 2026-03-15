# Coding Skill

## Overview
Generates implementation scaffolding based on requirements and planning.

## Input Parameters
- **task** (string, required): The implementation task description
- **plan** (object, optional): Structured plan from planning phase

## Output
```json
{
  "summary": "Implementation draft prepared for: <task>",
  "artifacts": [
    {
      "type": "markdown",
      "name": "solution.md"
    },
    {
      "type": "json",
      "name": "result.json"
    }
  ]
}
```

## Usage Example
```python
result = await skill_executor.execute("coding", {
    "task": "Implement user authentication",
    "plan": {"steps": [...]}
})
```

## Used By
- BuilderAgent (fourth stage of agent pipeline)
