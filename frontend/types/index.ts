// ============================================================
// AXON Frontend Types — Aligned with FastAPI Backend Schemas
// ============================================================

// --- Task Types ---

export type TaskStatus = "queued" | "running" | "completed" | "failed" | "pending" | "success" | "fail" | "in-progress";

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  result?: string;
  error?: string;
  trace_id?: string;
  created_at: string;
  updated_at?: string;
  // local-use fields mapped from legacy
  name?: string;       // alias for title
  version?: string;
  time?: string;
}

export interface AgentExecution {
  id: string;
  task_id: string;
  agent_name: string;
  start_time: string;
  end_time?: string;
  duration_ms?: number;
  input_payload?: Record<string, unknown>;
  output_payload?: Record<string, unknown>;
  error_message?: string;
}

export interface TaskTimeline {
  task_id: string;
  executions: AgentExecution[];
  total_duration_ms?: number;
}

// --- Evolution Types ---

export type EvolutionStatus = "idle" | "running" | "completed" | "failed";

export interface EvolutionState {
  status: EvolutionStatus;
  generated_skills: number;
  failed_tasks: number;
  last_run?: string;
  current_version?: string;
  message?: string;
}

export interface EvolutionEvent {
  id: string;
  version: string;
  title: string;
  description: string;
  capabilities: string[];
  stats: {
    filesChanged: number;
    linesAdded: number;
    linesRemoved: number;
  };
  date: string;
  // backend-aligned
  timestamp?: string;
  skills_added?: string[];
}

// --- Skill Types ---

export interface Skill {
  name: string;
  description: string;
  version: string;
  parameters?: Record<string, { type: string; required?: boolean; description?: string }>;
  created_at?: string;
  source?: "core" | "generated";
  source_file?: string;
}

// --- System Types ---

export type SystemStatusLevel = "healthy" | "degraded" | "offline" | "connecting";
export type DBStatus = "connected" | "disconnected" | "connecting";

export interface SystemHealth {
  status: SystemStatusLevel;
  llm_provider?: string;
  llmProviders?: string[];
  skills_count?: number;
  workers_active?: number;
  workersActive?: number;
  db_status?: DBStatus;
  dbStatus?: DBStatus;
  vector_store?: string;
  version?: string;
  uptime_seconds?: number;
  queue_size?: number;
  circuit_breaker?: "open" | "closed" | "half-open";
  agents_ready?: boolean;
}

export interface SystemMetrics {
  tasks_total?: number;
  tasks_completed?: number;
  tasks_failed?: number;
  skills_generated?: number;
  evolutions_run?: number;
  uptime_seconds?: number;
}

// --- Chat / Logs ---

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

// --- WebSocket Event Types ---

export interface WsEvent<T = unknown> {
  type: string;
  payload?: T;
  timestamp?: string;
  trace_id?: string;
}

export type WsEventType =
  | "task.created"
  | "task.updated"
  | "task.completed"
  | "task.failed"
  | "task.retried"
  | "agent.step"
  | "evolution.triggered"
  | "evolution.started"
  | "evolution.completed"
  | "evolution.failed"
  | "skill.generated"
  | "skill.created"
  | "skill.registered"
  | "system.updated"
  | "pipeline.completed";

// --- UI / App State ---

export type PersonaMode = "Engineer" | "Research Scientist" | "Startup Hacker" | "Minimal Agent";

export interface Notification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  message: string;
  timestamp: number;
  autoDismiss?: boolean;
}

// --- API Response wrappers ---

export interface ApiError {
  error_code?: string;
  message: string;
  context?: Record<string, unknown>;
  recovery?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
}
