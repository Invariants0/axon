"use client";

import { motion } from "framer-motion";
import {
  BrainCircuit,
  Search,
  Lightbulb,
  Wrench,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
} from "lucide-react";
import type { AgentExecution } from "@/types";

export type StageStatus = "waiting" | "running" | "done" | "error";

export interface StageInfo {
  key: string;
  label: string;
  status: StageStatus;
  durationMs?: number;
  errorMessage?: string;
}

const STAGE_CONFIG = [
  { key: "planning",  label: "Planning",  icon: BrainCircuit, color: "blue"    },
  { key: "research",  label: "Research",  icon: Search,       color: "amber"   },
  { key: "reasoning", label: "Reasoning", icon: Lightbulb,    color: "violet"  },
  { key: "builder",   label: "Builder",   icon: Wrench,       color: "emerald" },
] as const;

const COLOR = {
  blue:    { ring: "ring-blue-500/30",    text: "text-blue-400",    bg: "bg-blue-500/10",    bar: "bg-blue-500"    },
  amber:   { ring: "ring-amber-500/30",   text: "text-amber-400",   bg: "bg-amber-500/10",   bar: "bg-amber-500"   },
  violet:  { ring: "ring-violet-500/30",  text: "text-violet-400",  bg: "bg-violet-500/10",  bar: "bg-violet-500"  },
  emerald: { ring: "ring-emerald-500/30", text: "text-emerald-400", bg: "bg-emerald-500/10", bar: "bg-emerald-500" },
} as const;

/** Derive stage statuses from backend AgentExecution records */
export function deriveStagesFromExecutions(
  executions: AgentExecution[],
  taskStatus?: string
): StageInfo[] {
  return STAGE_CONFIG.map((cfg) => {
    const exec = executions.find((e) =>
      e.agent_name.toLowerCase().includes(cfg.key)
    );

    let status: StageStatus = "waiting";
    if (exec) {
      if (exec.error_message) status = "error";
      else if (exec.end_time)  status = "done";
      else                     status = "running";
    } else if (taskStatus === "running") {
      // If task is running but no execution record yet, mark first undone as running
      const doneBefore = executions.filter((e) =>
        !e.error_message && e.end_time
      );
      const stageIdx = STAGE_CONFIG.findIndex((s) => s.key === cfg.key);
      if (doneBefore.length === stageIdx) status = "running";
    }

    return {
      key: cfg.key,
      label: cfg.label,
      status,
      durationMs: exec?.duration_ms,
      errorMessage: exec?.error_message,
    };
  });
}

function fmtDuration(ms?: number): string {
  if (!ms) return "";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

interface PipelineStagesProps {
  /** Either pass explicit stage infos or AgentExecution records */
  stages?: StageInfo[];
  executions?: AgentExecution[];
  taskStatus?: string;
  /** Compact mode — smaller cards, less padding */
  compact?: boolean;
}

export function PipelineStages({
  stages,
  executions,
  taskStatus,
  compact = false,
}: PipelineStagesProps) {
  const resolved: StageInfo[] =
    stages ?? deriveStagesFromExecutions(executions ?? [], taskStatus);

  return (
    <div className={`grid grid-cols-4 gap-${compact ? "1.5" : "2"}`}>
      {STAGE_CONFIG.map((cfg, i) => {
        const info = resolved[i] ?? { key: cfg.key, label: cfg.label, status: "waiting" as StageStatus };
        const col  = COLOR[cfg.color];

        return (
          <motion.div
            key={cfg.key}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`relative rounded-xl border flex flex-col items-center gap-2 transition-all duration-500 ${
              compact ? "p-2.5" : "p-3.5"
            } ${
              info.status === "running" ? `ring-1 ${col.ring} ${col.bg} border-transparent` :
              info.status === "done"    ? "border-emerald-500/20 bg-emerald-500/[0.04]" :
              info.status === "error"   ? "border-red-500/20    bg-red-500/[0.04]" :
                                          "border-white/[0.05]  bg-white/[0.02]"
            }`}
          >
            {/* Running pulse */}
            {info.status === "running" && (
              <div className={`absolute inset-0 rounded-xl ${col.bg} animate-pulse opacity-40`} />
            )}

            {/* Icon */}
            <cfg.icon className={`relative z-10 ${compact ? "w-4 h-4" : "w-5 h-5"} ${
              info.status === "running" ? col.text :
              info.status === "done"    ? "text-emerald-400" :
              info.status === "error"   ? "text-red-400"     :
                                          "text-white/20"
            }`} />

            {/* Label */}
            <p className={`text-[9px] uppercase tracking-[0.12em] font-semibold relative z-10 ${
              info.status === "running" ? col.text :
              info.status === "done"    ? "text-emerald-400" :
              info.status === "error"   ? "text-red-400"     :
                                          "text-white/25"
            }`}>
              {cfg.label}
            </p>

            {/* Progress bar */}
            <div className="w-full h-0.5 bg-black/30 rounded-full overflow-hidden relative z-10">
              {info.status === "done" && (
                <div className="h-full bg-emerald-500 w-full" />
              )}
              {info.status === "running" && (
                <motion.div
                  className={`h-full ${col.bar}`}
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 15, ease: "linear", repeat: Infinity }}
                />
              )}
              {info.status === "error" && (
                <div className="h-full bg-red-500 w-3/4" />
              )}
            </div>

            {/* Status icon + duration */}
            <div className="flex items-center gap-1 relative z-10">
              {info.status === "done"    && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
              {info.status === "running" && <Loader2     className="w-3 h-3 animate-spin opacity-70 text-current" />}
              {info.status === "error"   && <XCircle     className="w-3 h-3 text-red-400" />}
              {info.status === "waiting" && <Clock       className="w-3 h-3 text-white/15" />}
              {info.durationMs && (
                <span className="text-[9px] font-mono text-white/30">
                  {fmtDuration(info.durationMs)}
                </span>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
