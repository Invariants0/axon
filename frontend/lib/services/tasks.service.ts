// ============================================================
// lib/services/tasks.service.ts
// Aligned with AXON contract §2.2
// - GET /tasks → { items: Task[] }
// - GET /tasks/{id} → Task
// - POST /tasks → Task (201)
// - GET /tasks/{id}/timeline → TaskTimeline (with timeline[] field)
// ============================================================

import { get, post } from "@/lib/http";
import { API_ROUTES } from "@/lib/constants";
import type { Task, TaskTimeline, ListResponse } from "@/types";

export interface CreateTaskPayload {
  title: string;
  description?: string;
  chat_id?: string;
}

export const tasksService = {
  /** GET /tasks — returns { items: Task[] } */
  async list(limit?: number): Promise<Task[]> {
    const url  = limit ? `${API_ROUTES.TASKS}?limit=${limit}` : API_ROUTES.TASKS;
    const raw  = await get<ListResponse<Task>>(url);
    const items = Array.isArray(raw)
      ? raw                              // backend returned plain array
      : (raw?.items ?? []);
    return items;
  },

  /** GET /tasks/{id} — returns Task */
  async get(id: string): Promise<Task> {
    return get<Task>(API_ROUTES.TASK(id));
  },

  /** POST /tasks — body: { title, description?, chat_id? } */
  async create(payload: CreateTaskPayload): Promise<Task> {
    return post<Task>(API_ROUTES.TASKS, payload);
  },

  /**
   * GET /tasks/{id}/timeline
   * Returns TaskTimeline with .timeline[] per data contract
   */
  async timeline(id: string): Promise<TaskTimeline> {
    const raw = await get<TaskTimeline>(API_ROUTES.TASK_TIMELINE(id));
    // Normalise: some older responses put executions in timeline field or vice-versa
    const entries = raw.timeline ?? [];
    return { ...raw, timeline: entries };
  },
} as const;
