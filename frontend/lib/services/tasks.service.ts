// ============================================================
// lib/services/tasks.service.ts
// All task-related API calls.
// Returns typed domain objects, never raw fetch responses.
// ============================================================

import { get, post } from "@/lib/http";
import { API_ROUTES, DEFAULT_TIMEOUT_MS, HEALTH_TIMEOUT_MS } from "@/lib/constants";
import { normalizeTask, normalizeSkill, unwrapItems, isTask, isSkill } from "@/types/schemas";
import type { Task, TaskTimeline, AgentExecution } from "@/types";

// ─── Payload types ────────────────────────────────────────────

export interface CreateTaskPayload {
  title: string;
  description?: string;
  chat_id?: string;
}

// ─── Tasks Service ────────────────────────────────────────────

export const tasksService = {
  /**
   * Submit a new task to the pipeline.
   */
  async create(payload: CreateTaskPayload): Promise<Task> {
    const raw = await post<Record<string, unknown>>(API_ROUTES.TASKS, payload);
    return normalizeTask(raw);
  },

  /**
   * List tasks, newest first. limit: 1–500.
   */
  async list(limit = 50, chatId?: string): Promise<Task[]> {
    const params = new URLSearchParams({ limit: String(limit) });
    if (chatId) params.set("chat_id", chatId);
    const raw = await get<unknown>(`${API_ROUTES.TASKS}?${params.toString()}`);

    // Backend returns { items: Task[] }
    const items = unwrapItems(raw, isTask);
    return items.map((t) => normalizeTask(t as unknown as Record<string, unknown>));
  },

  /**
   * Fetch a single task by ID.
   */
  async get(id: string): Promise<Task> {
    const raw = await get<Record<string, unknown>>(API_ROUTES.TASK(id));
    return normalizeTask(raw);
  },

  /**
   * Get the agent execution timeline for a task.
   */
  async timeline(id: string): Promise<TaskTimeline> {
    const raw = await get<Record<string, unknown>>(API_ROUTES.TASK_TIMELINE(id));
    const executions: AgentExecution[] = Array.isArray(raw?.executions)
      ? (raw.executions as AgentExecution[])
      : [];

    // Also check for the system/tasks/{id}/timeline endpoint for richer data
    return {
      task_id:          String(raw?.task_id ?? id),
      executions,
      total_duration_ms: Number(raw?.total_duration_ms ?? 0),
    };
  },
} as const;
