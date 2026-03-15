# Tasks API

Base path: `/tasks`

The Tasks API lets you submit work items to the AXON agent pipeline, list all tasks and inspect their current status or execution timeline.

All endpoints require the `X-API-Key` header.

## Index

| Method | Path | Description |
|--------|------|-------------|
| [GET](#list-tasks) | `/tasks/` | List all tasks |
| [POST](#create-a-task) | `/tasks/` | Create a new task |
| [GET](#get-a-task) | `/tasks/{task_id}` | Get a single task by ID |
| [GET](#get-task-timeline) | `/tasks/{task_id}/timeline` | Get the execution timeline for a task |

---

## List tasks

### `GET /tasks/`

Returns every task stored in the database.

**Response `200 OK`**

```json
{
  "items": [
    {
      "id": "abc123",
      "title": "Implement login page",
      "description": "Build the OAuth2 login flow",
      "status": "completed",
      "result": "...",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:01:00Z"
    }
  ]
}
```

---

## Create a task

### `POST /tasks/`

Submits a new task to the agent pipeline.

**Request body**

```json
{
  "title": "Implement login page",
  "description": "Build the OAuth2 login flow"
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `title` | string | ✓ | 1–255 characters |
| `description` | string | | Defaults to `""` |

**Response `201 Created`**

```json
{
  "id": "abc123",
  "title": "Implement login page",
  "description": "Build the OAuth2 login flow",
  "status": "pending",
  "result": "",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

---

## Get a task

### `GET /tasks/{task_id}`

Returns a single task by its ID.

**Path parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `task_id` | string | Unique task identifier |

**Response `200 OK`** — same shape as an individual item from [List tasks](#list-tasks).

**Response `404 Not Found`**

```json
{ "detail": "Task not found" }
```

---

## Get task timeline

### `GET /tasks/{task_id}/timeline`

Returns per-stage timing information for the four-stage agent pipeline.

**Path parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `task_id` | string | Unique task identifier |

**Response `200 OK`**

```json
{
  "task_id": "abc123",
  "stages": [
    { "name": "planning",  "start_time": null, "end_time": null, "duration_ms": 0 },
    { "name": "research",  "start_time": null, "end_time": null, "duration_ms": 0 },
    { "name": "reasoning", "start_time": null, "end_time": null, "duration_ms": 0 },
    { "name": "builder",   "start_time": null, "end_time": null, "duration_ms": 0 }
  ],
  "total_duration_ms": 0,
  "start_time": null,
  "end_time": null
}
```

| Field | Description |
|-------|-------------|
| `stages[].name` | Pipeline stage name |
| `stages[].duration_ms` | Wall-clock time spent in the stage (ms) |
| `total_duration_ms` | Sum of all stage durations (ms) |

---

## See also

- [API Index](README.md)
- [Evolution API](evolution.md)
- [System API](system.md)
