// ============================================================
// lib/services/system.service.ts
// Aligned with AXON contract §2.1
// ============================================================

import { get } from "@/lib/http";
import { API_ROUTES, HEALTH_TIMEOUT_MS } from "@/lib/constants";
import type {
  SystemHealth,
  SystemStatus,
  SystemMetrics,
  PipelineGraph,
  EventStats,
  SystemConfig,
} from "@/types";

export const systemService = {
  /** GET /health — no auth required, fast probe */
  async health(): Promise<SystemHealth> {
    const raw = await get<SystemHealth>(
      API_ROUTES.HEALTH,
      { timeoutMs: HEALTH_TIMEOUT_MS, retries: 1 }
    );
    return raw;
  },

  /** GET /system — full status with agent breakdown */
  async status(): Promise<SystemStatus> {
    return get<SystemStatus>(API_ROUTES.SYSTEM, { retries: 1 });
  },

  /** GET /system/metrics — queue depth + worker count */
  async metrics(): Promise<SystemMetrics> {
    return get<SystemMetrics>(API_ROUTES.SYSTEM_METRICS, { retries: 1 });
  },

  /** GET /system/pipeline — 4-agent DAG */
  async pipeline(): Promise<PipelineGraph> {
    return get<PipelineGraph>(API_ROUTES.SYSTEM_PIPELINE, { retries: 1 });
  },

  /** GET /system/events/stats — event bus counters */
  async eventStats(): Promise<EventStats> {
    return get<EventStats>(API_ROUTES.EVENT_STATS, { retries: 1 });
  },

  /** GET /system/config — active feature flags & mode */
  async config(): Promise<SystemConfig> {
    return get<SystemConfig>(API_ROUTES.SYSTEM_CONFIG, { retries: 0 });
  },
} as const;
