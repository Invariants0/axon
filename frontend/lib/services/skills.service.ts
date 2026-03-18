// ============================================================
// lib/services/skills.service.ts
// ============================================================

import { get } from "@/lib/http";
import { API_ROUTES } from "@/lib/constants";
import { normalizeSkill, isSkill, unwrapItems } from "@/types/schemas";
import type { Skill, SkillCode } from "@/types";

export const skillsService = {
  /**
   * List all registered skills (core + generated).
   */
  async list(): Promise<Skill[]> {
    const raw = await get<unknown>(API_ROUTES.SKILLS);
    const items = unwrapItems(raw, isSkill);
    return items.map((s) => normalizeSkill(s as unknown as Record<string, unknown>));
  },

  /**
   * Get source code for a specific skill.
   * Falls back to a placeholder if the endpoint returns 404.
   */
  async getCode(name: string): Promise<SkillCode> {
    const raw = await get<Record<string, unknown>>(API_ROUTES.SKILL_CODE(name));
    return {
      name:         String(raw.name ?? name),
      source_code:  String(raw.source_code ?? `# ${name} source not available`),
      version:      String(raw.version ?? "unknown"),
      description:  String(raw.description ?? ""),
    };
  },
} as const;
