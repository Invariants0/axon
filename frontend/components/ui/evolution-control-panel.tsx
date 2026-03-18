"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  BarChart2,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { evolutionService } from "@/lib/services/evolution.service";
import { useAppStore } from "@/store/app-store";
import type { EvolutionState } from "@/types";

const STATUS_CONFIG = {
  idle: {
    label: "Idle",
    color: "text-white/50",
    dot: "bg-white/30",
    glow: "",
  },
  running: {
    label: "Running",
    color: "text-yellow-400",
    dot: "bg-yellow-400 animate-pulse",
    glow: "shadow-[0_0_8px_rgba(234,179,8,0.4)]",
  },
  error: {
    label: "Error",
    color: "text-red-400",
    dot: "bg-red-400",
    glow: "",
  },
};

export function EvolutionControlPanel() {
  const { evolutionState, setEvolutionState, addNotification, addLog } = useAppStore();
  const [isTriggering, setIsTriggering] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [progress, setProgress] = useState(0);

  // Fetch initial evolution status
  useEffect(() => {
    evolutionService.getStatus().then(setEvolutionState).catch(() => {});
  }, [setEvolutionState]);

  // Simulate progress animation during evolution
  useEffect(() => {
    if (evolutionState?.status !== "running") {
      setProgress(0);
      return;
    }
    const interval = setInterval(() => {
      setProgress((p) => Math.min(p + Math.random() * 3, 95));
    }, 800);
    return () => clearInterval(interval);
  }, [evolutionState?.status]);

  const handleTrigger = useCallback(async () => {
    setShowConfirm(false);
    setIsTriggering(true);

    setEvolutionState({
      status: "running",
      generated_skills: 0,
      failed_tasks: 0,
      last_run: null,
    });
    addLog("[EVOLUTION] ⚡ Manual evolution cycle triggered via dashboard...");

    try {
      await evolutionService.trigger();
      addNotification("Evolution cycle triggered — monitoring event stream", "info");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      addLog(`[EVOLUTION] ✗ Failed to trigger: ${msg}`);
      addNotification(`Failed to trigger evolution: ${msg}`, "error");
      setEvolutionState({ status: "error", generated_skills: 0, failed_tasks: 1, last_run: null });
    } finally {
      setIsTriggering(false);
    }
  }, [setEvolutionState, addLog, addNotification]);

  const state: EvolutionState = evolutionState ?? {
    status: "idle",
    generated_skills: 0,
    failed_tasks: 0,
    last_run: null,
  };

  const cfg = STATUS_CONFIG[state.status] ?? STATUS_CONFIG.idle;
  const isRunning = state.status === "running" || isTriggering;

  return (
    <Card className="border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />

      <CardHeader className="py-4 px-5 border-b border-white/5 bg-white/5">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          Self-Evolution Engine
        </CardTitle>
      </CardHeader>

      <CardContent className="p-5 space-y-5">
        {/* Status Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${cfg.dot} ${cfg.glow}`} />
            <span className={`text-sm font-medium ${cfg.color}`}>{cfg.label}</span>
          </div>
          {state.last_run && (
            <span className="text-[10px] text-white/30 font-mono flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(state.last_run).toLocaleTimeString()}
            </span>
          )}
        </div>

        {/* Progress Bar */}
        <AnimatePresence>
          {isRunning && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-1"
            >
              <div className="flex items-center justify-between text-[10px] text-white/40">
                <span>Generating skill module...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary to-purple-400 rounded-full"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-white/5 border border-white/5 space-y-1">
            <div className="text-[10px] uppercase tracking-wider text-white/40">
              Skills Generated
            </div>
            <div className="text-xl font-mono font-bold text-emerald-400">
              {state.generated_skills ?? 0}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-white/5 border border-white/5 space-y-1">
            <div className="text-[10px] uppercase tracking-wider text-white/40">
              Failed Tasks
            </div>
            <div className="text-xl font-mono font-bold text-red-400">
              {state.failed_tasks ?? 0}
            </div>
          </div>
        </div>


        {/* Trigger Button or Confirm Dialog */}
        <AnimatePresence mode="wait">
          {showConfirm ? (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-3"
            >
              <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <AlertCircle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-300/80 leading-relaxed">
                  This will trigger AXON&apos;s autonomous evolution cycle. The system will
                  analyze failed tasks and attempt to generate new skill modules.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="flex-1 text-white/60 hover:text-white border border-white/10"
                  onClick={() => setShowConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="flex-1 bg-primary hover:bg-primary/90 text-white"
                  onClick={handleTrigger}
                >
                  Confirm
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="trigger" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Button
                className="w-full relative overflow-hidden bg-gradient-to-r from-primary/80 to-purple-600/80 hover:from-primary hover:to-purple-600 text-white border-0 shadow-[0_0_20px_rgba(168,85,247,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isRunning}
                onClick={() => setShowConfirm(true)}
              >
                {isRunning ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Evolving...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Trigger Evolution Cycle
                  </span>
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

      </CardContent>
    </Card>
  );
}
