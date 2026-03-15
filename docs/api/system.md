# System API

Base path: `/system`

The System API exposes the overall health and operational state of the AXON platform, including the agent pipeline topology and live runtime metrics.

All endpoints require the `X-API-Key` header.

## Index

| Method | Path | Description |
|--------|------|-------------|
| [GET](#get-system-status) | `/system/` | Full platform status |
| [GET](#get-pipeline-graph) | `/system/pipeline` | Agent pipeline DAG |
| [GET](#get-system-metrics) | `/system/metrics` | Live runtime metrics |

---

## Get system status

### `GET /system/`

Returns the operational state of every major subsystem.

**Response `200 OK`**

```json
{
  "status": "ready",
  "app": "AXON",
  "environment": "development",
  "database": "ok",
  "vector_store": "ok",
  "skills_loaded": 5,
  "agents_ready": true,
  "event_bus": "running",
  "task_queue": "running"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | Overall platform status (`ready`) |
| `app` | string | Application name |
| `environment` | string | Deployment environment (e.g. `development`, `production`) |
| `database` | string | Database connectivity (`ok` \| `error`) |
| `vector_store` | string | Vector store connectivity (`ok` \| `error`) |
| `skills_loaded` | integer | Number of skills currently in the registry |
| `agents_ready` | boolean | Whether the agent pool is initialised |
| `event_bus` | string | Event bus state (`running` \| `stopped`) |
| `task_queue` | string | Task queue state (`running` \| `stopped`) |

---

## Get pipeline graph

### `GET /system/pipeline`

Returns the directed acyclic graph (DAG) of the four-stage agent pipeline.

**Response `200 OK`**

```json
{
  "nodes": ["planning", "research", "reasoning", "builder"],
  "edges": [
    ["planning", "research"],
    ["research", "reasoning"],
    ["reasoning", "builder"]
  ],
  "description": "Sequential 4-stage agent pipeline"
}
```

| Field | Description |
|-------|-------------|
| `nodes` | Ordered list of pipeline stage names |
| `edges` | Directed edges as `[source, target]` pairs |
| `description` | Human-readable pipeline description |

---

## Get system metrics

### `GET /system/metrics`

Returns live runtime metrics collected from the worker pool, task queue, circuit breaker and memory subsystems.

**Response `200 OK`**

```json
{
  "worker_count": 4,
  "queue_size": 0,
  "circuit_breaker": "closed",
  "uptime_seconds": 3600,
  "version": "Phase-3"
}
```

The exact fields returned depend on which subsystems are active. On collection failure the response includes an `error` key describing the problem alongside any available partial metrics.

---

## See also

- [API Index](README.md)
- [Tasks API](tasks.md)
- [WebSocket API](websocket.md) — subscribe to real-time system events
