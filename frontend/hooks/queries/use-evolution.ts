// ============================================================
// hooks/queries/use-evolution.ts
// ============================================================

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS, STALE_TIME_MEDIUM, STALE_TIME_LONG } from "@/lib/constants";
import { evolutionService } from "@/lib/services";
import { useAppStore } from "@/store/app-store";

export function useEvolutionStatus() {
  return useQuery({
    queryKey:        QUERY_KEYS.evolution,
    queryFn:         () => evolutionService.getStatus(),
    staleTime:       STALE_TIME_MEDIUM,
    refetchInterval: 15_000,
  });
}

export function useEvolutionTimeline() {
  return useQuery({
    queryKey:  QUERY_KEYS.evolutionTl,
    queryFn:   () => evolutionService.getTimeline(),
    staleTime: STALE_TIME_LONG,
  });
}

export function useTriggerEvolution() {
  const qc = useQueryClient();
  const { setEvolutionActive, setEvolutionState, addNotification, addLog } = useAppStore();

  return useMutation({
    mutationFn: () => evolutionService.trigger(),

    onMutate: () => {
      setEvolutionActive(true);
      addLog("[EVOLUTION] ⚡ Manual evolution cycle triggered…");
    },

    onSuccess: (state) => {
      setEvolutionState(state);
      addNotification("Evolution cycle triggered", "info");
      qc.invalidateQueries({ queryKey: QUERY_KEYS.evolution });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.evolutionTl });
    },

    onError: (err: Error) => {
      setEvolutionActive(false);
      addNotification(`Evolution failed: ${err.message}`, "error");
    },
  });
}
