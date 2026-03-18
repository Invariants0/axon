// ============================================================
// hooks/queries/use-skills.ts
// ============================================================

"use client";

import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS, STALE_TIME_LONG } from "@/lib/constants";
import { skillsService } from "@/lib/services";

export function useSkills() {
  return useQuery({
    queryKey:  QUERY_KEYS.skills,
    queryFn:   () => skillsService.list(),
    staleTime: STALE_TIME_LONG,
  });
}

export function useSkillCode(name: string) {
  return useQuery({
    queryKey:  QUERY_KEYS.skillCode(name),
    queryFn:   () => skillsService.getCode(name),
    staleTime: STALE_TIME_LONG,
    enabled:   Boolean(name),
  });
}
