// ============================================================
// lib/constants.ts
// Single source of truth — all API endpoints and config
// ============================================================

/** Base REST API URL */
export const API_BASE_URL =
  (process.env.NEXT_PUBLIC_API_URL ?? "http://axon.luxionlabs.com/api").replace(/\/$/, "");

/** WebSocket event stream URL */
export const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ?? "ws://axon.luxionlabs.com/ws/events";

/** Zustand localStorage persistence key */
export const STORE_PERSIST_KEY = "axon-store";

/** API Key header name expected by the FastAPI backend */
export const API_KEY_HEADER = "X-API-Key";

// ─── Route segments ────────────────────────────────────────────
export const API_ROUTES = {
  // Tasks
  TASKS:            "/tasks/",
  TASK:             (id: string) => `/tasks/${id}`,
  TASK_TIMELINE:    (id: string) => `/tasks/${id}/timeline`,

  // Evolution
  EVOLUTION:        "/evolution/",
  EVOLUTION_RUN:    "/evolution/run",
  EVOLUTION_TIMELINE: "/evolution/timeline",

  // Skills
  SKILLS:           "/skills/",
  SKILL_CODE:       (name: string) => `/skills/${name}/code`,

  // System
  HEALTH:           "/health",
  SYSTEM:           "/system/",
  SYSTEM_METRICS:   "/system/metrics",
  SYSTEM_PIPELINE:  "/system/pipeline",
  SYSTEM_CONFIG:    "/system/config",
  EVENT_STATS:      "/system/events/stats",

  // Chats
  CHATS:            "/chats/",
  CHAT:             (id: string) => `/chats/${id}`,
  CHAT_TASKS:       (id: string) => `/chats/${id}/tasks`,
  // Auth
  AUTH_SIGNUP:      "/auth/signup",
  AUTH_LOGIN:       "/auth/login",
} as const;

// ─── TanStack Query Keys ───────────────────────────────────────
// Centralised so invalidations work consistently everywhere
export const QUERY_KEYS = {
  tasks:          ["tasks"]           as const,
  task:           (id: string) =>     ["tasks", id] as const,
  taskTimeline:   (id: string) =>     ["tasks", id, "timeline"] as const,
  evolution:      ["evolution"]       as const,
  evolutionTl:    ["evolution", "timeline"] as const,
  skills:         ["skills"]          as const,
  skillCode:      (name: string) =>   ["skills", name, "code"] as const,
  health:         ["system", "health"] as const,
  systemStatus:   ["system", "status"] as const,
  metrics:        ["system", "metrics"] as const,
  pipeline:       ["system", "pipeline"] as const,
  chats:          ["chats"]           as const,
  chat:           (id: string) =>     ["chats", id] as const,
  chatTasks:      (id: string) =>     ["chats", id, "tasks"] as const,
  eventStats:     ["system", "events", "stats"] as const,
  systemConfig:   ["system", "config"] as const,
} as const;

// ─── Request defaults ──────────────────────────────────────────
export const DEFAULT_TIMEOUT_MS  = 12_000;
export const DEFAULT_RETRIES     = 2;
export const HEALTH_TIMEOUT_MS   = 5_000;
export const STALE_TIME_SHORT    = 10_000;   // 10s  — real-time data
export const STALE_TIME_MEDIUM   = 30_000;   // 30s  — semi-static
export const STALE_TIME_LONG     = 300_000;  // 5min — rarely changes
