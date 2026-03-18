"use client";

import { SkillsCatalog } from "@/components/ui/skills-catalog";
import { EvolutionControlPanel } from "@/components/ui/evolution-control-panel";

export default function SkillsPage() {
  return (
    <div className="h-full p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
      {/* Skills List */}
      <div className="lg:col-span-8 flex flex-col min-h-0">
        <SkillsCatalog />
      </div>

      {/* Sidebar: trigger evolution to generate more skills */}
      <div className="lg:col-span-4 flex flex-col gap-4">
        <EvolutionControlPanel />
      </div>
    </div>
  );
}
