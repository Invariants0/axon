// ============================================================
// types/index.ts
// AXON Frontend Types — strictly aligned with backend contract
// Source: AXON_BACKEND_FRONTEND_DATA_CONTRACT.md v1.0
// ============================================================

// ─── Task ─────────────────────────────────────────────────────

/** UI persona mode */
export type PersonaMode = "operator" | "developer" | "researcher";

/** Canonical task statuses per the backend state machine */
export type TaskStatus = "queued" | "running" | "completed" | "failed";

/** Backend TaskResponse schema (GET /tasks, GET /tasks/{id}, POST /tasks) */
export interface Task {
  id: string;
  chat_id: string | null;
  title: string;
  description: string;
  status: TaskStatus;
  result: string;              // always present, can be ""
  created_at: string;          // ISO8601
  updated_at: string;          // ISO8601
  trace_id?: string;           // present in some responses
}

// ─── Task Timeline ────────────────────────────────────────────

/** Single agent entry in GET /tasks/{id}/timeline */
export interface TimelineEntry {
  agent_name: "planning" | "research" | "reasoning" | "builder";
  status: "completed" | "failed" | "skipped";
  start_time: string | null;   // ISO8601 or null
  end_time: string | null;     // ISO8601 or null
  duration_ms: number | null;  // ms or null
  error: string | null;
}

/** Full response from GET /tasks/{id}/timeline */
export interface TaskTimeline {
  task_id: string;
  trace_id: string;
  task_status: string;
  created_at: string;
  total_duration_ms: number;
  agent_count: number;
  timeline: TimelineEntry[];   // NOT "executions" — per contract
}

/** @deprecated Use TimelineEntry. Kept for backward compat with detail pages. */
export type AgentExecution = TimelineEntry;

// ─── Chat ─────────────────────────────────────────────────────

/** Backend ChatResponse schema */
export interface Chat {
  id: string;
  title: string;
  created_at: string;          // ISO8601
  updated_at: string;          // ISO8601
}

// ─── Skill ────────────────────────────────────────────────────

/** Backend SkillResponse schema (GET /skills) */
export interface Skill {
  id: string | null;           // nullable
  name: string;
  description: string;
  version: string;             // semver e.g. "1.0.0"
  parameters: Record<string, { type: string; required: boolean }>;
  created_at: string | null;   // nullable
  updated_at: string | null;   // nullable
}

/** Extended skill code (from GET /skills/{name}/code) */
export interface SkillCode {
  name: string;
  source_code: string;
  version: string;
  description: string;
}

// ─── Evolution ────────────────────────────────────────────────

/** Backend EvolutionStatus schema (GET /evolution, POST /evolution/run) */
export interface EvolutionState {
  status: "idle" | "running" | "error";   // per contract (not "completed"/"failed")
  generated_skills: number;
  failed_tasks: number;
  last_run: string | null;                // ISO8601 or null
}

/** Frontend-only history entry (built from WS events) */
export interface EvolutionHistoryEntry {
  version: string;
  timestamp: string;
  skills_added: string[];
}

// ─── System ───────────────────────────────────────────────────

/** GET /health response */
export interface SystemHealth {
  backend: string;             // "ok"
  agents: string;              // "reachable" | "error"
  skills_loaded: number;
  vector_store: string;        // "connected" | "disconnected"
  llm_provider: string;        // "gradient" | "gemini" | etc.
  axon_mode: string;           // "mock" | "gemini" | "gradient" | "real"
  debug_pipeline: boolean;
}

/** GET /system response */
export interface SystemStatus {
  status: string;              // "ready" | "degraded" | "error"
  app: string;                 // "AXON"
  environment: string;         // "development" | "staging" | "production"
  axon_mode: string;
  database: string;            // "ok" | "error"
  vector_store: string;        // "ok" | "error"
  skills_loaded: number;
  agents_ready: boolean;
  event_bus: string;           // "running" | "stopped"
  task_queue: string;          // "running" | "stopped"
  version: string;
  gradient_llm?: {
    status: string;
    provider: string;
    model: string;
    endpoint: string;
  };
  adk_agents?: {
    status: string;
    agents: Record<string, { status: string }>;
    digitalocean_api_token_configured: boolean;
  };
}

/** GET /system/metrics response */
export interface SystemMetrics {
  timestamp: number;           // Unix seconds
  version: string;
  workers: number;
  queued_tasks: number;
}

/** GET /system/events/stats response */
export interface EventStats {
  event_bus_status: string;
  total_events_published: number;
  subscriber_count: number;
  version: string;
}

/** GET /system/config response */
export interface SystemConfig {
  axon_mode: string;
  llm_provider: string;
  vector_store_type: string;
  evolution_enabled: boolean;
  feature_flags: Record<string, boolean>;
}

/** GET /system/pipeline response */
export interface PipelineGraph {
  nodes: string[];             // ["planning", "research", "reasoning", "builder"]
  edges: [string, string][];   // [["planning","research"], ...]
  description: string;
}

// ─── Auth ─────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export interface AuthResponse {
  access_token: string;
  user: AuthUser;
  expires_at: number;         // ms timestamp
}

// ─── WebSocket Events (per contract §3.2) ─────────────────────

/**
 * Canonical WS event structure from backend:
 * { "event": "...", "trace_id": "...", "task_id": "...", "timestamp": "...", "data": {...} }
 *
 * The connection event is different:
 * { "event": "connected", "message": "..." }
 */
export interface WsEvent {
  event: string;              // the event name — "event", NOT "type"
  trace_id?: string;
  task_id?: string;
  timestamp?: string;
  data?: Record<string, unknown>;
  // Connection event only:
  message?: string;
}

export type WsEventName =
  | "connected"
  // Task
  | "task.created"
  | "task.started"
  | "task.completed"
  | "task.failed"
  // Pipeline
  | "pipeline.started"
  | "pipeline.completed"
  // Agent
  | "agent.started"
  | "agent.completed"
  | "agent.error"
  // Evolution
  | "evolution.triggered"
  | "evolution.generated"
  | "evolution.validation_failed"
  // Skill
  | "skill.executed"
  | "skill.error"
  // Legacy (kept for compatibility)
  | "task.retried"
  | "task.updated"
  | "agent.step"
  | "evolution.started"
  | "evolution.completed"
  | "evolution.failed"
  | "skill.generated"
  | "skill.created"
  | "skill.registered"
  | "system.updated";

// ─── UI / App State ───────────────────────────────────────────

export interface ChatMessage {
  id: string;
  role: "user" | "system" | "agent";
  content: string;
  timestamp: number;
  isStreaming?: boolean;
}

export interface AgentLog {
  id?: string;
  taskId?: string;
  agent: string;
  message: string;
  timestamp: number;
  type: "info" | "warning" | "error" | "success" | "evolution" | "execution" | "reasoning";
}

export interface Notification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  message: string;
  timestamp: number;
  autoDismiss?: boolean;
}

// ─── Request/Response wrappers ────────────────────────────────

/** Backend list response wrapper: { items: T[] } */
export interface ListResponse<T> {
  items: T[];
}

export interface ApiErrorBody {
  detail?: string | Array<{ msg: string; type: string }>;
  message?: string;
}
