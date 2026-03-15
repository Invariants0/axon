# Web Search Skill

## Overview
Synthesizes search intent into research notes. Currently returns placeholder data (no live web access wired in).

## Input Parameters
- **query** (string, required): The search query

## Output
```json
{
  "query": "user search query",
  "notes": [
    "No live web access wired in skill runtime for query: <query>",
    "Use dedicated retrieval tooling for production web data."
  ]
}
```

## Usage Example
```python
result = await skill_executor.execute("web_search", {
    "query": "How to build REST APIs with FastAPI"
})
```

## Production Integration
To enable live web search:
1. Wire up a real search API client (e.g., SerpAPI, Tavily, Google Custom Search)
2. Replace the placeholder return in execute()
3. Add API key to .env configuration

## Used By
- ResearchAgent (second stage of agent pipeline)
