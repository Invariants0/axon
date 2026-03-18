"use client";

// ============================================================
// components/ui/system-metrics-widget.tsx
// Uses SystemHealth fields per data contract §2.1:
//   backend, agents, skills_loaded, vector_store, llm_provider, axon_mode
// ============================================================

import { useEffect, useState, useCallback } from "react";
import { Server, Database, BrainCircuit, Activity, RefreshCw, Cpu } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { systemService } from "@/lib/services/system.service";
import { useAppStore } from "@/store/app-store";
import type { SystemHealth } from "@/types";

export function SystemMetricsWidget() {
  const { systemHealth, setSystemHealth } = useAppStore();
  const [isLoading, setIsLoading] = useState(!systemHealth);

  const fetchHealth = useCallback(async () => {
    try {
      const h = await systemService.health();
      setSystemHealth(h);
    } catch {
      setSystemHealth({
        backend:       "error",
        agents:        "error",
        skills_loaded: 0,
        vector_store:  "disconnected",
        llm_provider:  "unknown",
        axon_mode:     "mock",
        debug_pipeline: false,
      });
    } finally {
      setIsLoading(false);
    }
  }, [setSystemHealth]);

  useEffect(() => {
    if (!systemHealth) fetchHealth();
    const interval = setInterval(fetchHealth, 20_000);
    return () => clearInterval(interval);
  }, [fetchHealth, systemHealth]);

  // Contract fields directly
  const h: SystemHealth = systemHealth ?? {
    backend:       "connecting",
    agents:        "unknown",
    skills_loaded: 0,
    vector_store:  "unknown",
    llm_provider:  "unknown",
    axon_mode:     "mock",
    debug_pipeline: false,
  };

  const backendOk = h.backend === "ok";
  const agentsOk  = h.agents === "reachable";
  const dbOk      = h.vector_store === "connected";

  const statusDot = backendOk
    ? "bg-emerald-500 animate-pulse shadow-[0_0_5px_rgba(16,185,129,0.8)]"
    : h.backend === "error"
    ? "bg-red-500"
    : "bg-white/20 animate-pulse";

  return (
    <Card className="h-full border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl relative overflow-hidden group">
      <CardHeader className="py-3 px-5 border-b border-white/5 bg-white/5 flex flex-row items-center justify-between">
        <CardTitle className="text-xs font-semibold flex items-center gap-2 text-white/90">
          <Activity className="w-3.5 h-3.5 text-blue-400" />
          System Health
        </CardTitle>
        <button
          onClick={fetchHealth}
          className="text-white/20 hover:text-white/70 transition-colors"
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </CardHeader>
      <CardContent className="p-4 grid grid-cols-2 gap-4">
        {/* Backend */}
        <div className="flex flex-col gap-1 p-3 rounded-md bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 text-xs font-medium text-white/80">
            <Server className="w-3 h-3 text-emerald-400" />
            Backend
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />
            <span className="text-[10px] uppercase tracking-widest text-emerald-500 flex-1 capitalize">
              {backendOk ? "online" : h.backend}
            </span>
          </div>
          <p className="text-[10px] font-mono text-white/30 mt-0.5">
            mode: {h.axon_mode}
          </p>
        </div>

        {/* Vector DB */}
        <div className="flex flex-col gap-1 p-3 rounded-md bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 text-xs font-medium text-white/80">
            <Database className="w-3 h-3 text-purple-400" />
            Vector DB
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className={`w-1.5 h-1.5 rounded-full ${dbOk ? "bg-emerald-500" : "bg-yellow-500"}`} />
            <span className="text-[10px] uppercase tracking-widest text-white/50">
              {h.vector_store}
            </span>
          </div>
        </div>

        {/* Agents */}
        <div className="flex flex-col gap-1 p-3 rounded-md bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 text-xs font-medium text-white/80">
            <Cpu className="w-3 h-3 text-blue-400" />
            Agents
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className={`w-1.5 h-1.5 rounded-full ${agentsOk ? "bg-emerald-500" : "bg-yellow-500"}`} />
            <span className="text-[10px] uppercase tracking-widest text-white/50">
              {h.agents}
            </span>
          </div>
        </div>

        {/* LLM / Skills */}
        <div className="flex flex-col gap-1 p-3 rounded-md bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 text-xs font-medium text-white/80">
            <BrainCircuit className="w-3 h-3 text-yellow-400" />
            Inference
          </div>
          <p className="text-[10px] font-mono text-white/50 mt-1 capitalize">{h.llm_provider}</p>
          <p className="text-[10px] text-white/30">{h.skills_loaded} skills</p>
        </div>
      </CardContent>
    </Card>
  );
}
