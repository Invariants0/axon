"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  Pause,
  Play,
  BrainCircuit,
  Search,
  Lightbulb,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/app-store";
import { tasksService } from "@/lib/services/tasks.service";
import { AgentLogStream } from "@/components/dashboard/agent-log-stream";
import type { Task } from "@/types";

// ─── Agent Stage Configuration ────────────────────────────────
const STAGES = [
  { key: "planning",  label: "Planning",  icon: BrainCircuit, color: "blue"    },
  { key: "research",  label: "Research",  icon: Search,       color: "amber"   },
  { key: "reasoning", label: "Reasoning", icon: Lightbulb,    color: "violet"  },
  { key: "builder",   label: "Builder",   icon: Wrench,       color: "emerald" },
] as const;

type StageKey = (typeof STAGES)[number]["key"];
type StageState = "waiting" | "running" | "done" | "error";

const COLOR_MAP: Record<string, { ring: string; text: string; bg: string; bar: string }> = {
  blue:    { ring: "ring-blue-500/30",    text: "text-blue-400",    bg: "bg-blue-500/10",    bar: "bg-blue-500"    },
  amber:   { ring: "ring-amber-500/30",   text: "text-amber-400",   bg: "bg-amber-500/10",   bar: "bg-amber-500"   },
  violet:  { ring: "ring-violet-500/30",  text: "text-violet-400",  bg: "bg-violet-500/10",  bar: "bg-violet-500"  },
  emerald: { ring: "ring-emerald-500/30", text: "text-emerald-400", bg: "bg-emerald-500/10", bar: "bg-emerald-500" },
};

function stageStateForTask(task: Task | null, key: StageKey): StageState {
  if (!task) return "waiting";
  const status = task.status;
  const idx = STAGES.findIndex((s) => s.key === key);
  if (status === "queued") return "waiting";
  if (status === "running") {
    if (idx === 0) return "done";
    if (idx === 1) return "running";
    return "waiting";
  }
  if (status === "completed") return "done";
  if (status === "failed") {
    return idx === 0 ? "done" : idx === 1 ? "error" : "waiting";
  }
  return "waiting";
}

// ─── Pipeline Stages Bar ─────────────────────────────────────
function PipelineStages({ task, activeStage }: { task: Task | null; activeStage: StageKey | null }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {STAGES.map((stage) => {
        const col = COLOR_MAP[stage.color];
        const state: StageState = activeStage === stage.key
          ? "running"
          : stageStateForTask(task, stage.key);

        return (
          <div
            key={stage.key}
            className={`relative rounded-xl border p-3 flex flex-col items-center gap-2 transition-all duration-500 ${
              state === "running" ? `ring-1 ${col.ring} ${col.bg} border-transparent` :
              state === "done"    ? "border-emerald-500/20 bg-emerald-500/[0.04]" :
              state === "error"   ? "border-red-500/20    bg-red-500/[0.04]"    :
                                    "border-white/[0.05]  bg-white/[0.02]"
            }`}
          >
            {state === "running" && (
              <div className={`absolute inset-0 rounded-xl ${col.bg} animate-pulse opacity-40`} />
            )}
            <stage.icon className={`w-5 h-5 relative z-10 ${
              state === "running" ? col.text :
              state === "done"    ? "text-emerald-400" :
              state === "error"   ? "text-red-400" :
                                    "text-white/20"
            }`} />
            <p className={`text-[10px] uppercase tracking-[0.12em] font-semibold relative z-10 ${
              state === "running" ? col.text :
              state === "done"    ? "text-emerald-400" :
              state === "error"   ? "text-red-400" :
                                    "text-white/30"
            }`}>
              {stage.label}
            </p>
            <div className="w-full h-0.5 bg-black/30 rounded-full overflow-hidden relative z-10">
              {state === "done" && <div className="h-full bg-emerald-500 w-full" />}
              {state === "running" && (
                <motion.div
                  className={`h-full ${col.bar}`}
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 12, ease: "linear", repeat: Infinity, repeatType: "loop" }}
                />
              )}
              {state === "error" && <div className="h-full bg-red-500 w-full" />}
            </div>
            <div className="relative z-10">
              {state === "done"    && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
              {state === "running" && <Loader2      className="w-3.5 h-3.5 animate-spin text-current opacity-70" />}
              {state === "error"   && <XCircle      className="w-3.5 h-3.5 text-red-400" />}
              {state === "waiting" && <Clock        className="w-3.5 h-3.5 text-white/15" />}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function ExecutionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { logs } = useAppStore();
  const [task, setTask] = useState<Task | null>(null);
  const [activeStage, setActiveStage] = useState<StageKey | null>(null);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());

  // Poll task every 3s while running
  useEffect(() => {
    if (!id) return;
    const fetch = () =>
      tasksService.get(id).then((t) => setTask(t)).catch(() => {});
    fetch();
    const iv = setInterval(fetch, 3000);
    return () => clearInterval(iv);
  }, [id]);

  // Parse activeStage from WS logs
  useEffect(() => {
    const last = [...logs].reverse().find((l) => {
      const u = l.toUpperCase();
      return STAGES.some((s) => u.includes(`[${s.key.toUpperCase()}]`));
    });
    if (!last) return;
    const match = STAGES.find((s) => last.toUpperCase().includes(`[${s.key.toUpperCase()}]`));
    if (match) setActiveStage(match.key);
  }, [logs]);

  // Elapsed timer
  useEffect(() => {
    startRef.current = Date.now();
    const iv = setInterval(
      () => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)),
      1000
    );
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-5 py-3.5 border-b border-white/[0.06] flex items-center gap-4 bg-black/20">
        <Link href="/dashboard/execution">
          <Button
            size="icon"
            variant="ghost"
            className="text-white/40 hover:text-white/80 hover:bg-white/[0.04] w-8 h-8"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>

        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-mono text-white/25 uppercase tracking-[0.15em]">
            Task {id?.slice(0, 12)}…
          </p>
          <h1 className="text-base font-display font-bold text-white/90 truncate">
            {task?.title ?? "Loading execution stream…"}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-white/30 font-mono">
            <Clock className="w-3 h-3" />
            {Math.floor(elapsed / 60).toString().padStart(2, "0")}:
            {(elapsed % 60).toString().padStart(2, "0")}
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setPaused((p) => !p)}
            className="text-white/40 hover:text-white/80 hover:bg-white/[0.04] gap-1.5 text-xs h-7 px-2.5"
          >
            {paused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
            {paused ? "Resume" : "Pause"}
          </Button>
        </div>
      </div>

      {/* Pipeline */}
      <div className="shrink-0 p-4 border-b border-white/[0.04]">
        <PipelineStages task={task} activeStage={activeStage} />
      </div>

      {/* Log Stream via reusable component */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        <AgentLogStream
          taskId={id}
          showFilters
          showClear={false}
          maxLines={300}
          className="flex-1"
        />
      </div>
    </div>
  );
}
