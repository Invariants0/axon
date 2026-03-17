# Skills API

Base path: `/skills`

The Skills API provides read access to the skill registry — the catalogue of capability modules that AXON agents can invoke.

All endpoints require the `X-API-Key` header.

## Index

| Method | Path | Description |
|--------|------|-------------|
| [GET](#list-skills) | `/skills/` | List all registered skills |

---

## List skills

### `GET /skills/`

Returns every skill currently loaded in the skill registry.

**Response `200 OK`**

```json
{
  "items": [
    {
      "id": "skill-uuid",
      "name": "web_search",
      "description": "Search the web for a given query",
      "version": "1.0.0",
      "parameters": {
        "query": { "type": "string", "description": "Search query" }
      },
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

**Skill object fields**

| Field | Type | Description |
|-------|------|-------------|
| `id` | string \| null | Unique skill identifier (null for built-in skills) |
| `name` | string | Machine-readable skill name |
| `description` | string | Human-readable description |
| `version` | string | Semantic version string (default `1.0.0`) |
| `parameters` | object | JSON-Schema-like parameter definitions |
| `created_at` | string \| null | ISO-8601 creation timestamp |
| `updated_at` | string \| null | ISO-8601 last-updated timestamp |

---

## See also

- [API Index](README.md)
- [Evolution API](evolution.md) — new skills can be generated through evolution runs
