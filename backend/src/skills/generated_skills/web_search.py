SKILL = {
    "name": "web_search",
    "description": "Synthesize search intent into research notes",
    "parameters": {
        "query": {"type": "string", "required": True},
    },
    "version": "1.0.0",
}


async def execute(payload: dict) -> dict:
    query = payload.get("query", "")
    return {
        "query": query,
        "notes": [
            f"No live web access wired in skill runtime for query: {query}",
            "Use dedicated retrieval tooling for production web data.",
        ],
    }
