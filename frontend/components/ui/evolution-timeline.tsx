"use client";

import { useAppStore } from "@/store/app-store";
import { motion, AnimatePresence } from "framer-motion";
import { Network } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function EvolutionTimeline() {
  const { isEvolutionActive, skills } = useAppStore();

  const generatedSkills = skills.filter(
    (s) => !["reasoning", "planning", "coding"].includes(s)
  );

  return (
    <Card className="h-48 shrink-0 border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl flex flex-col w-full">
      <CardHeader className="py-3 px-5 border-b border-white/5 bg-white/5">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Network className="w-4 h-4 text-primary" />
          Evolution Timeline
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 flex items-center gap-4 overflow-x-auto flex-1">
        <div className="flex items-center gap-4 min-w-max">
          <div className="flex flex-col gap-2">
            <div className="text-xs text-muted-foreground">T-0</div>
            <div className="p-3 rounded-lg border border-white/5 bg-white/5 w-48">
              <div className="font-bold text-sm mb-1 text-foreground">
                AXON v0
              </div>
              <div className="text-xs text-muted-foreground">
                Initial deployment (Core Skills)
              </div>
            </div>
          </div>

          <AnimatePresence>
            {generatedSkills.map((skill, idx) => (
              <motion.div
                key={skill}
                initial={{ opacity: 0, scale: 0.8, x: -20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                className="flex items-center gap-4"
              >
                <div className="w-8 h-[1px] bg-white/20"></div>
                <div className="flex flex-col gap-2">
                  <div className="text-xs text-primary animate-pulse">T+{idx + 1}</div>
                  <div className="p-3 rounded-lg border border-primary/30 bg-primary/10 w-48 shadow-[0_0_20px_rgba(168,85,247,0.1)] transition-all">
                    <div className="font-bold text-sm text-primary mb-1">
                      AXON v1.{idx + 1}
                    </div>
                    <div className="text-xs text-muted-foreground break-words">
                      + added <span className="font-mono text-primary">{skill}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {isEvolutionActive && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-4"
              >
                <div className="w-8 h-[1px] bg-primary/40 stroke-dasharray-[4_4]"></div>
                <div className="flex flex-col gap-2">
                  <div className="text-xs text-yellow-500 animate-pulse">Evolving...</div>
                  <div className="p-3 rounded-lg border border-dashed border-yellow-500/50 bg-yellow-500/10 w-48 flex items-center justify-center">
                    <div className="text-xs text-yellow-500 font-mono animate-pulse">
                      Generating Solution...
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}
