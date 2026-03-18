// ============================================================
// lib/services/evolution.service.ts
// ============================================================

import { get, post } from "@/lib/http";
import { API_ROUTES } from "@/lib/constants";
import { normalizeEvolutionState } from "@/types/schemas";
import type { EvolutionState, EvolutionHistoryEntry } from "@/types";

export interface TriggerEvolutionResult {
  success: boolean;
  state: EvolutionState;
}

export const evolutionService = {
  /**
   * Get the current evolution engine status.
   */
  async getStatus(): Promise<EvolutionState> {
    const raw = await get<Record<string, unknown>>(API_ROUTES.EVOLUTION);
    return normalizeEvolutionState(raw);
  },

  /**
   * Manually trigger an evolution cycle.
   * Returns same shape as getStatus() — the backend echoes back the new state.
   */
  async trigger(): Promise<EvolutionState> {
    const raw = await post<Record<string, unknown>>(API_ROUTES.EVOLUTION_RUN);
    return normalizeEvolutionState(raw);
  },

  /**
   * Get the evolution version history timeline.
   * Backend may not implement this — returns [] gracefully.
   */
  async getTimeline(): Promise<EvolutionHistoryEntry[]> {
    const raw = await get<unknown>(API_ROUTES.EVOLUTION_TIMELINE);
    if (!Array.isArray(raw)) return [];
    return raw.map((entry) => {
      const e = entry as Record<string, unknown>;
      return {
        version:      String(e.version ?? "v?"),
        timestamp:    String(e.timestamp ?? new Date().toISOString()),
        skills_added: Array.isArray(e.skills_added)
          ? (e.skills_added as string[])
          : [],
      };
    });
  },
} as const;
