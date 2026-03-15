# Evolution API

Base path: `/evolution`

The Evolution API exposes the self-improvement cycle of AXON. It lets you check whether an evolution run is in progress and trigger a new cycle on demand.

All endpoints require the `X-API-Key` header.

## Index

| Method | Path | Description |
|--------|------|-------------|
| [GET](#get-evolution-status) | `/evolution/` | Get the current evolution status |
| [POST](#trigger-evolution) | `/evolution/run` | Trigger a new evolution cycle |

---

## Get evolution status

### `GET /evolution/`

Returns a snapshot of the most recent evolution run.

**Response `200 OK`**

```json
{
  "status": "idle",
  "generated_skills": 3,
  "failed_tasks": 0,
  "last_run": "2024-01-01T00:00:00Z"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | Current state, e.g. `idle`, `running`, `completed`, `error` |
| `generated_skills` | integer | Number of new skills created in the last run |
| `failed_tasks` | integer | Number of tasks that failed during the last run |
| `last_run` | string \| null | ISO-8601 timestamp of the last completed run |

---

## Trigger evolution

### `POST /evolution/run`

Starts a new evolution cycle. The response reflects the state immediately after the trigger is accepted.

**Request body** — none required.

**Response `200 OK`**

```json
{
  "status": "running",
  "generated_skills": 0,
  "failed_tasks": 0,
  "last_run": null
}
```

---

## See also

- [API Index](README.md)
- [System API](system.md)
- [Skills API](skills.md)
