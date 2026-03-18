// ============================================================
// AXON API Client — Full REST client with retry + error handling
// ============================================================

import type {
  Task,
  TaskTimeline,
  EvolutionState,
  Skill,
  SystemHealth,
  SystemMetrics,
  ApiError,
} from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

// Internal fetch with timeout + retry + error normalization
async function apiFetch<T>(
  input: RequestInfo,
  init?: RequestInit,
  options?: { retries?: number; timeoutMs?: number }
): Promise<T> {
  const { retries = 2, timeoutMs = 12000 } = options ?? {};

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(input, {
        ...init,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          ...(init?.headers ?? {}),
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Don't retry 4xx errors
        if (response.status >= 400 && response.status < 500) {
          let errBody: ApiError | null = null;
          try {
            errBody = await response.json();
          } catch {}
          throw new Error(errBody?.message ?? `HTTP ${response.status}: ${response.statusText}`);
        }

        // Retry 5xx
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
      }

      // Handle 204 No Content
      if (response.status === 204) return undefined as T;

      return response.json() as Promise<T>;
    } catch (err) {
      clearTimeout(timeoutId);
      lastError = err instanceof Error ? err : new Error(String(err));

      if (attempt < retries) {
        // Exponential backoff
        await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 300));
      }
    }
  }

  throw lastError ?? new Error("Request failed after retries");
}

// ─── Tasks API ───────────────────────────────────────────────

export const tasksApi = {
  /** Create a new task and submit it to the pipeline */
  create: (title: string, description?: string): Promise<Task> =>
    apiFetch(`${API_BASE_URL}/tasks/`, {
      method: "POST",
      body: JSON.stringify({ title, description }),
    }),

  /** Get all tasks (most recent first) */
  list: (limit = 50): Promise<Task[]> =>
    apiFetch(`${API_BASE_URL}/tasks/?limit=${limit}`),

  /** Get a single task by ID */
  get: (id: string): Promise<Task> =>
    apiFetch(`${API_BASE_URL}/tasks/${id}`),

  /** Get the agent execution timeline for a task */
  timeline: (id: string): Promise<TaskTimeline> =>
    apiFetch(`${API_BASE_URL}/tasks/${id}/timeline`),
};

// ─── Evolution API ────────────────────────────────────────────

export const evolutionApi = {
  /** Get current evolution status */
  status: (): Promise<EvolutionState> =>
    apiFetch(`${API_BASE_URL}/evolution/`),

  /** Manually trigger an evolution cycle */
  trigger: (): Promise<{ success: boolean; message?: string }> =>
    apiFetch(`${API_BASE_URL}/evolution/run`, { method: "POST" }),

  /** Get evolution version timeline (if backend implements it) */
  timeline: (): Promise<{ version: string; timestamp: string; skills_added: string[] }[]> =>
    apiFetch<{ version: string; timestamp: string; skills_added: string[] }[]>(`${API_BASE_URL}/evolution/timeline`).catch(() => [] as { version: string; timestamp: string; skills_added: string[] }[]),
};

// ─── Skills API ───────────────────────────────────────────────

export const skillsApi = {
  /** Get all installed skills */
  list: (): Promise<Skill[]> =>
    apiFetch(`${API_BASE_URL}/skills/`),

  /** Get source code for a specific skill */
  getCode: (name: string): Promise<{ name: string; source_code: string; version: string }> =>
    apiFetch<{ name: string; source_code: string; version: string }>(`${API_BASE_URL}/skills/${name}/code`).catch(() => ({
      name,
      source_code: `# Skill "${name}" source code not available`,
      version: "unknown",
    })),
};

// ─── System API ───────────────────────────────────────────────

export const systemApi = {
  /** Health check (lightweight) */
  health: (): Promise<SystemHealth> =>
    apiFetch<SystemHealth>(`${API_BASE_URL}/health`, {}, { retries: 1, timeoutMs: 5000 }),

  /** Full system status */
  status: (): Promise<SystemHealth> =>
    apiFetch<SystemHealth>(`${API_BASE_URL}/system/`, {}, { retries: 1 }).catch(() => ({
      status: "connecting" as const,
    })),

  /** System performance metrics */
  metrics: (): Promise<SystemMetrics> =>
    apiFetch<SystemMetrics>(`${API_BASE_URL}/system/metrics`, {}, { retries: 1 }).catch(() => ({} as SystemMetrics)),

  /** Pipeline graph (4-agent topology) */
  pipeline: (): Promise<{ nodes: unknown[]; edges: unknown[] }> =>
    apiFetch<{ nodes: unknown[]; edges: unknown[] }>(`${API_BASE_URL}/system/pipeline`, {}, { retries: 1 }).catch(() => ({
      nodes: [],
      edges: [],
    })),
};

// ─── Legacy compat shim (used by existing pages) ─────────────

export const axonApi = {
  createTask: (title: string, description?: string) => tasksApi.create(title, description),
  getTasks: () => tasksApi.list(),
  triggerEvolution: () => evolutionApi.trigger(),
  getHealth: () => systemApi.health(),
  getSkills: () => skillsApi.list(),
  getEvolutionStatus: () => evolutionApi.status(),
  getSystemStatus: () => systemApi.status(),
  getSystemMetrics: () => systemApi.metrics(),
};
