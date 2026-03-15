# Reasoning Skill

## Overview
Synthesizes research findings and generates reasoning insights.

## Input Parameters
- **evidence** (array, required): List of research findings to reason about

## Output
```json
{
  "reasoning": [
    {
      "theme": "key insight",
      "connections": ["finding1", "finding2"]
    }
  ]
}
```

## Usage Example
```python
result = await skill_executor.execute("reasoning", {
    "evidence": ["finding1", "finding2", "finding3"]
})
```

## Used By
- ReasoningAgent (third stage of agent pipeline)
