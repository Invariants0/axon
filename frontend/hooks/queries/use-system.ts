// ============================================================
// hooks/queries/use-system.ts
// ============================================================

"use client";

import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS, STALE_TIME_SHORT, STALE_TIME_MEDIUM } from "@/lib/constants";
import { systemService } from "@/lib/services";

export function useSystemHealth() {
  return useQuery({
    queryKey:        QUERY_KEYS.health,
    queryFn:         () => systemService.health(),
    staleTime:       STALE_TIME_SHORT,
    refetchInterval: 20_000,
    retry:           1,
  });
}

export function useSystemStatus() {
  return useQuery({
    queryKey:        QUERY_KEYS.systemStatus,
    queryFn:         () => systemService.status(),
    staleTime:       STALE_TIME_MEDIUM,
    refetchInterval: 30_000,
    retry:           1,
  });
}

export function useSystemMetrics() {
  return useQuery({
    queryKey:        QUERY_KEYS.metrics,
    queryFn:         () => systemService.metrics(),
    staleTime:       STALE_TIME_SHORT,
    refetchInterval: 15_000,
  });
}

export function useSystemPipeline() {
  return useQuery({
    queryKey:  QUERY_KEYS.pipeline,
    queryFn:   () => systemService.pipeline(),
    staleTime: 60_000, // pipeline structure rarely changes
  });
}
