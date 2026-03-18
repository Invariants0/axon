"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Search,
  Brain,
  Zap,
  ShieldCheck,
  Archive,
  GitMerge,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  ChevronRight,
  Code2,
  PackageOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppStore } from "@/store/app-store";
import { evolutionService } from "@/lib/services/evolution.service";
import type { EvolutionState } from "@/types";

// ─── Evolution Stage Tracker ──────────────────────────────────
const EVOLUTION_STAGES = [
  { id: "detect", label: "Capability Failure Detected", icon: AlertTriangle, color: "text-red-400",     desc: "System identified a missing skill from task failure" },
  { id: "research", label: "Research Phase",             icon: Search,       color: "text-amber-400",   desc: "AI researching solutions for missing capability" },
  { id: "plan",     label: "Architecture Planning",      icon: Brain,        color: "text-violet-400",  desc: "Designing skill structure, parameters & logic" },
  { id: "generate", label: "Skill Code Generation",      icon: Code2,        color: "text-blue-400",    desc: "LLM generating optimized Python skill module" },
  { id: "validate", label: "Safety Validation",          icon: ShieldCheck,  color: "text-cyan-400",    desc: "Syntax, import scans & functional checks" },
  { id: "register", label: "Skill Registration",         icon: Archive,      color: "text-emerald-400", desc: "Adding skill to registry and disk" },
  { id: "version",  label: "Version Upgrade",            icon: GitMerge,     color: "text-primary",     desc: "AXON evolves to next version with new capabilities" },
] as const;

type StageId = (typeof EVOLUTION_STAGES)[number]["id"];

function stageForStatus(status: EvolutionState["status"] | undefined): number {
  if (!status || status === "idle")    return -1;
  if (status === "running")            return 3; // mid-generation
  if (status === "error")              return 4; // failed at validate
  return -1;
}

function EvolutionStageTracker({ evolutionState }: { evolutionState: EvolutionState | null }) {
  const currentIdx = stageForStatus(evolutionState?.status);
  const isRunning  = evolutionState?.status === "running";

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className={`w-4 h-4 ${isRunning ? "text-primary animate-pulse" : "text-white/30"}`} />
          <span className="text-sm font-semibold text-white/90">Evolution Stage Tracker</span>
        </div>
        <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
          evolutionState?.status === "running" ? "text-primary    bg-primary/10    border-primary/20" :
          evolutionState?.status === "error"   ? "text-red-400    bg-red-500/10    border-red-500/20" :
                                                  "text-white/30   bg-white/[0.03]  border-white/[0.06]"
        }`}>
          {evolutionState?.status ?? "Idle"}
        </span>
      </div>

      <div className="relative">
        {/* Track line */}
        <div className="absolute left-[18px] top-5 bottom-5 w-px bg-white/[0.06]" />
        {currentIdx >= 0 && (
          <motion.div
            className="absolute left-[18px] top-5 w-px bg-gradient-to-b from-primary to-primary/0"
            initial={{ height: 0 }}
            animate={{ height: `${((currentIdx) / (EVOLUTION_STAGES.length - 1)) * 100}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        )}

        <div className="space-y-3 relative">
          {EVOLUTION_STAGES.map((stage, i) => {
            const isDone    = i < currentIdx;
            const isCurrent = i === currentIdx && evolutionState?.status === "running";
            const isFailed  = i === currentIdx && evolutionState?.status === "error";

            return (
              <motion.div
                key={stage.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`flex items-start gap-3 p-3 rounded-lg transition-all ${
                  isCurrent ? "bg-primary/[0.06] border border-primary/20" :
                  isDone    ? "opacity-100" :
                              "opacity-40"
                }`}
              >
                {/* Stage dot */}
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border ${
                  isDone    ? "bg-emerald-500/10 border-emerald-500/30" :
                  isCurrent ? "bg-primary/10    border-primary/30" :
                  isFailed  ? "bg-red-500/10    border-red-500/30" :
                              "bg-white/[0.03]  border-white/[0.08]"
                }`}>
                  {isDone    ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> :
                   isCurrent ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> :
                   isFailed  ? <XCircle className="w-4 h-4 text-red-400" /> :
                               <stage.icon className={`w-4 h-4 ${stage.color} opacity-50`} />}
                </div>

                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-semibold ${
                      isDone    ? "text-emerald-400" :
                      isCurrent ? stage.color :
                      isFailed  ? "text-red-400" :
                                  "text-white/50"
                    }`}>
                      {stage.label}
                    </p>
                    {isCurrent && (
                      <span className="text-[9px] bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wide">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-white/30 mt-0.5 leading-relaxed">{stage.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function EvolutionPage() {
  const { evolutionState, evolutionHistory, isEvolutionActive, setEvolutionState,
          skills, addNotification, addLog } = useAppStore();
  const [triggering, setTriggering] = useState(false);

  useEffect(() => {
    evolutionService.getStatus().then(setEvolutionState).catch(() => {});
  }, [setEvolutionState]);

  const triggerEvolution = useCallback(async () => {
    setTriggering(true);
    addLog("[EVOLUTION] ⚡ Evolution cycle triggered manually…");
    try {
      await evolutionService.trigger();
      addNotification("Evolution cycle initiated", "info");
    } catch (err) {
      addNotification("Failed to trigger evolution", "error");
    } finally {
      setTriggering(false);
    }
  }, [addLog, addNotification]);

  const CORE_SKILLS = ["reasoning", "planning", "coding"];

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-white">Evolution Engine</h1>
            <p className="text-sm text-white/40 mt-1">
              Self-evolving AI architecture — real-time skill generation & version management
            </p>
          </div>
          <Button
            disabled={isEvolutionActive || triggering}
            onClick={triggerEvolution}
            className="bg-gradient-to-r from-primary/70 to-purple-600/70 hover:from-primary hover:to-purple-600 text-white border-0 shadow-[0_0_20px_rgba(168,85,247,0.2)] shrink-0 disabled:opacity-40"
          >
            {triggering ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Triggering…</>
            ) : isEvolutionActive ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Evolving…</>
            ) : (
              <><Zap className="w-4 h-4 mr-2" /> Trigger Evolution</>
            )}
          </Button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Generated Skills",  value: evolutionState?.generated_skills ?? 0, color: "text-emerald-400" },
            { label: "Failed Tasks",       value: evolutionState?.failed_tasks ?? 0,      color: "text-red-400" },
            { label: "Total Skills",       value: skills.length,                           color: "text-blue-400" },
            { label: "Evolution Cycles",   value: evolutionHistory.length,                 color: "text-primary" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <div className="text-[9px] uppercase tracking-[0.15em] text-white/30 font-semibold mb-2">{s.label}</div>
              <div className={`text-3xl font-mono font-bold ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Stage Tracker — 3 cols */}
          <div className="lg:col-span-3">
            <EvolutionStageTracker evolutionState={evolutionState} />
          </div>

          {/* Version Timeline — 2 cols */}
          <div className="lg:col-span-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-4">
            <div className="flex items-center gap-2">
              <GitMerge className="w-4 h-4 text-white/40" />
              <span className="text-sm font-semibold text-white/90">Version History</span>
            </div>

            {evolutionHistory.length > 0 ? (
              <div className="space-y-2">
                {[...evolutionHistory].reverse().map((entry, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-start gap-3 p-3 rounded-lg border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.03] transition-colors"
                  >
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0 shadow-[0_0_6px_rgba(168,85,247,0.5)]" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-mono font-bold text-primary">{entry.version}</span>
                        <span className="text-[9px] text-white/20 font-mono shrink-0">
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      {entry.skills_added.length > 0 && (
                        <p className="text-[11px] text-white/40 mt-0.5 truncate">
                          +{entry.skills_added.join(", ")}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Clock className="w-8 h-8 text-white/10 mb-3" />
                <p className="text-sm text-white/25">No evolution history yet</p>
                <p className="text-xs text-white/15 mt-1">Trigger an evolution cycle to begin</p>
              </div>
            )}
          </div>
        </div>

        {/* Skills Capability Map */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PackageOpen className="w-4 h-4 text-white/40" />
              <span className="text-sm font-semibold text-white/90">Capability Map</span>
            </div>
            <span className="text-[10px] font-mono text-white/25">{skills.length} skills registered</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <AnimatePresence>
              {skills.map((skill) => {
                const isCore = CORE_SKILLS.includes(skill);
                return (
                  <motion.div
                    key={skill}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium border ${
                      isCore
                        ? "text-blue-400  border-blue-500/20  bg-blue-500/[0.06]"
                        : "text-emerald-400 border-emerald-500/20 bg-emerald-500/[0.06]"
                    }`}
                  >
                    <div className={`w-1 h-1 rounded-full ${isCore ? "bg-blue-400" : "bg-emerald-400"}`} />
                    {skill}
                    {!isCore && (
                      <span className="text-[8px] font-bold uppercase text-emerald-400/70">new</span>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
