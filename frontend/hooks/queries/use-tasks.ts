// ============================================================
// hooks/queries/use-tasks.ts
// TanStack Query hooks for tasks domain.
// Components import these — never call services directly.
// ============================================================

"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { QUERY_KEYS, STALE_TIME_SHORT, STALE_TIME_MEDIUM } from "@/lib/constants";
import { tasksService, type CreateTaskPayload } from "@/lib/services";
import { useAppStore } from "@/store/app-store";
import type { Task, TaskTimeline } from "@/types";

// ─── useTaskList ────────────────────────────────────────────────

export function useTaskList(limit = 50) {
  return useQuery({
    queryKey:  QUERY_KEYS.tasks,
    queryFn:   () => tasksService.list(limit),
    staleTime: STALE_TIME_SHORT,
    refetchInterval: 10_000, // auto-refresh every 10s
  });
}

// ─── useTask ────────────────────────────────────────────────────

export function useTask(
  id: string,
  options?: Partial<UseQueryOptions<Task>>
) {
  return useQuery({
    queryKey:  QUERY_KEYS.task(id),
    queryFn:   () => tasksService.get(id),
    staleTime: STALE_TIME_SHORT,
    enabled:   Boolean(id),
    refetchInterval: 5_000,
    ...options,
  });
}

// ─── useTaskTimeline ────────────────────────────────────────────

export function useTaskTimeline(id: string) {
  return useQuery({
    queryKey:  QUERY_KEYS.taskTimeline(id),
    queryFn:   () => tasksService.timeline(id),
    staleTime: STALE_TIME_MEDIUM,
    enabled:   Boolean(id),
  });
}

// ─── useCreateTask ──────────────────────────────────────────────

export function useCreateTask() {
  const qc      = useQueryClient();
  const addTask = useAppStore((s) => s.addTask);
  const addNotification = useAppStore((s) => s.addNotification);

  return useMutation({
    mutationFn: (payload: CreateTaskPayload) => tasksService.create(payload),

    onSuccess: (task) => {
      // Sync into Zustand for WS-driven components
      addTask(task);
      addNotification(`Task created: "${task.title}"`, "success");
      // Invalidate list so the history page updates
      qc.invalidateQueries({ queryKey: QUERY_KEYS.tasks });
    },

    onError: (err: Error) => {
      addNotification(`Task failed: ${err.message}`, "error");
    },
  });
}
