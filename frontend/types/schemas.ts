// ============================================================
// types/schemas.ts
// Runtime type guards + normalizers
// Aligned with AXON_BACKEND_FRONTEND_DATA_CONTRACT.md v1.0
// ============================================================

import type {
  Task,
  TaskTimeline,
  TimelineEntry,
  Skill,
  Chat,
  EvolutionState,
  SystemHealth,
} from "./index";

type R = Record<string, unknown>;

// ─── Helpers ──────────────────────────────────────────────────

const str  = (v: unknown, fallback = "")  => typeof v === "string" ? v : fallback;
const num  = (v: unknown, fallback = 0)   => typeof v === "number" ? v : Number(v ?? fallback) || fallback;
const bool = (v: unknown, fallback = false) => typeof v === "boolean" ? v : Boolean(v ?? fallback);
const orNull = (v: unknown): string | null => typeof v === "string" ? v : null;

// ─── unwrapItems ──────────────────────────────────────────────

/** Extracts items from { items: T[] } or a plain T[] response */
export function unwrapItems<T>(raw: unknown, guard: (x: unknown) => x is T): T[] {
  if (Array.isArray(raw)) return raw.filter(guard);
  const obj = raw as Record<string, unknown>;
  if (Array.isArray(obj?.items)) return obj.items.filter(guard);
  return [];
}

// ─── Task ─────────────────────────────────────────────────────

export function isTask(x: unknown): x is Task {
  if (!x || typeof x !== "object") return false;
  const o = x as R;
  // Minimal: must have id + title
  return typeof o.id === "string" && typeof o.title === "string";
}

export function normalizeTask(o: R): Task {
  return {
    id:          str(o.id,          crypto.randomUUID?.() ?? String(Math.random())),
    chat_id:     orNull(o.chat_id),
    title:       str(o.title,       "Untitled Task"),
    description: str(o.description, ""),
    status:      (["queued","running","completed","failed"].includes(str(o.status))
                   ? str(o.status)
                   : "queued") as Task["status"],
    result:      str(o.result, ""),
    created_at:  str(o.created_at, new Date().toISOString()),
    updated_at:  str(o.updated_at, new Date().toISOString()),
    trace_id:    orNull(o.trace_id) ?? undefined,
  };
}

// ─── TimelineEntry ────────────────────────────────────────────

export function isTimelineEntry(x: unknown): x is TimelineEntry {
  if (!x || typeof x !== "object") return false;
  const o = x as R;
  return typeof o.agent_name === "string";
}

export function normalizeTimelineEntry(o: R): TimelineEntry {
  return {
    agent_name:  str(o.agent_name, "unknown") as TimelineEntry["agent_name"],
    status:      (["completed","failed","skipped"].includes(str(o.status)) ? str(o.status) : "completed") as TimelineEntry["status"],
    start_time:  orNull(o.start_time),
    end_time:    orNull(o.end_time),
    duration_ms: typeof o.duration_ms === "number" ? o.duration_ms : null,
    error:       orNull(o.error),
  };
}

// ─── TaskTimeline ─────────────────────────────────────────────

export function isTaskTimeline(x: unknown): x is TaskTimeline {
  if (!x || typeof x !== "object") return false;
  const o = x as R;
  return typeof o.task_id === "string";
}

export function normalizeTaskTimeline(o: R): TaskTimeline {
  const rawEntries = Array.isArray(o.timeline) ? o.timeline : [];
  return {
    task_id:          str(o.task_id, ""),
    trace_id:         str(o.trace_id, ""),
    task_status:      str(o.task_status, ""),
    created_at:       str(o.created_at, new Date().toISOString()),
    total_duration_ms: num(o.total_duration_ms),
    agent_count:      num(o.agent_count),
    timeline:         rawEntries.filter(isTimelineEntry).map(e => normalizeTimelineEntry(e as unknown as R)),
  };
}

// ─── Skill ────────────────────────────────────────────────────

export function isSkill(x: unknown): x is Skill {
  if (!x || typeof x !== "object") return false;
  const o = x as R;
  return typeof o.name === "string";
}

export function normalizeSkill(o: R): Skill {
  return {
    id:          orNull(o.id),
    name:        str(o.name, "unknown"),
    description: str(o.description, ""),
    version:     str(o.version, "1.0.0"),
    parameters:  (o.parameters && typeof o.parameters === "object"
                   ? o.parameters
                   : {}) as Record<string, { type: string; required: boolean }>,
    created_at:  orNull(o.created_at),
    updated_at:  orNull(o.updated_at),
  };
}

// ─── Chat ─────────────────────────────────────────────────────

export function isChat(x: unknown): x is Chat {
  if (!x || typeof x !== "object") return false;
  const o = x as R;
  return typeof o.id === "string";
}

export function normalizeChat(o: R): Chat {
  return {
    id:         str(o.id, ""),
    title:      str(o.title, "New Chat"),
    created_at: str(o.created_at, new Date().toISOString()),
    updated_at: str(o.updated_at, new Date().toISOString()),
  };
}

// ─── EvolutionState ────────────────────────────────────────────

export function isEvolutionState(x: unknown): x is EvolutionState {
  if (!x || typeof x !== "object") return false;
  const o = x as R;
  return typeof o.status === "string";
}

export function normalizeEvolutionState(o: R): EvolutionState {
  // Contract status: "idle" | "running" | "error"
  const rawStatus = str(o.status, "idle");
  const status = (["idle","running","error"].includes(rawStatus)
    ? rawStatus
    : "idle") as EvolutionState["status"];

  return {
    status,
    generated_skills: num(o.generated_skills),
    failed_tasks:     num(o.failed_tasks),
    last_run:         orNull(o.last_run),
  };
}

// ─── SystemHealth ─────────────────────────────────────────────

export function normalizeSystemHealth(o: R): SystemHealth {
  return {
    backend:       str(o.backend,       "ok"),
    agents:        str(o.agents,        "unknown"),
    skills_loaded: num(o.skills_loaded, 0),
    vector_store:  str(o.vector_store,  "unknown"),
    llm_provider:  str(o.llm_provider,  "unknown"),
    axon_mode:     str(o.axon_mode,     "mock"),
    debug_pipeline: bool(o.debug_pipeline, false),
  };
}
