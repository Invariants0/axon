"use client";

// ============================================================
// components/ui/system-status-panel.tsx
// Uses exact contract §2.1 fields from SystemHealth:
//   backend, agents, skills_loaded, vector_store, llm_provider,
//   axon_mode, debug_pipeline
// ============================================================

import { useEffect, useState, useCallback } from "react";
import { Activity, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { systemService } from "@/lib/services/system.service";
import { useAppStore } from "@/store/app-store";
import type { SystemHealth } from "@/types";

interface MetricRowProps {
  label: string;
  value: string;
  status?: "ok" | "error" | "warning" | "neutral";
}

function MetricRow({ label, value, status = "neutral" }: MetricRowProps) {
  const statusColors = {
    ok:      "text-emerald-400",
    error:   "text-red-400",
    warning: "text-yellow-400",
    neutral: "text-white/60",
  };
  const dotColors = {
    ok:      "bg-emerald-400 shadow-[0_0_5px_rgba(16,185,129,0.5)]",
    error:   "bg-red-400",
    warning: "bg-yellow-400",
    neutral: "bg-white/20",
  };

  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
      <span className="text-xs text-white/40">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[status]}`} />
        <span className={`text-xs font-mono font-medium ${statusColors[status]}`}>{value}</span>
      </div>
    </div>
  );
}

const DEFAULT_HEALTH: SystemHealth = {
  backend:        "connecting",
  agents:         "unknown",
  skills_loaded:  0,
  vector_store:   "unknown",
  llm_provider:   "unknown",
  axon_mode:      "mock",
  debug_pipeline: false,
};

export function SystemStatusPanel() {
  const { systemHealth, setSystemHealth } = useAppStore();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh]   = useState<Date | null>(null);

  const fetchStatus = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const health = await systemService.health();
      setSystemHealth(health);
      setLastRefresh(new Date());
    } catch {
      setSystemHealth({ ...DEFAULT_HEALTH, backend: "error", agents: "error" });
    } finally {
      setIsRefreshing(false);
    }
  }, [setSystemHealth]);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 15_000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const h: SystemHealth = systemHealth ?? DEFAULT_HEALTH;

  const backendOk   = h.backend === "ok";
  const agentsOk    = h.agents === "reachable";
  const dbOk        = h.vector_store === "connected";
  const llmLabel    = h.llm_provider ?? "unknown";

  const overallLabel = backendOk ? "Online" : h.backend === "error" ? "Offline" : "Connecting…";
  const overallColor = backendOk ? "text-emerald-400" : h.backend === "error" ? "text-red-400" : "text-white/40";
  const overallDot   = backendOk
    ? "bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.6)]"
    : h.backend === "error"
    ? "bg-red-400"
    : "bg-white/20 animate-pulse";

  return (
    <Card className="border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-bl from-blue-500/5 via-transparent to-transparent pointer-events-none" />

      <CardHeader className="py-4 px-5 border-b border-white/5 bg-white/5">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" />
            System Status
          </div>
          <button
            onClick={fetchStatus}
            disabled={isRefreshing}
            className="text-white/30 hover:text-white/70 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-5 space-y-4">
        {/* Overall Status */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
          <div className={`w-2.5 h-2.5 rounded-full ${overallDot}`} />
          <div>
            <div className={`font-medium text-sm ${overallColor}`}>{overallLabel}</div>
            {lastRefresh && (
              <div className="text-[10px] text-white/30">
                Updated {lastRefresh.toLocaleTimeString()}
              </div>
            )}
          </div>
          <div className="ml-auto text-[10px] font-mono text-white/40 bg-white/5 px-2 py-1 rounded border border-white/5">
            {h.axon_mode}
          </div>
        </div>

        {/* Metrics — all from contract */}
        <div className="space-y-0">
          <MetricRow
            label="Backend"
            value={h.backend}
            status={backendOk ? "ok" : "error"}
          />
          <MetricRow
            label="Agents"
            value={h.agents}
            status={agentsOk ? "ok" : "warning"}
          />
          <MetricRow
            label="Vector Store"
            value={h.vector_store}
            status={dbOk ? "ok" : h.vector_store === "disconnected" ? "error" : "warning"}
          />
          <MetricRow
            label="LLM Provider"
            value={llmLabel}
            status={llmLabel !== "unknown" ? "ok" : "warning"}
          />
          <MetricRow
            label="Skills Loaded"
            value={String(h.skills_loaded)}
            status={h.skills_loaded > 0 ? "ok" : "warning"}
          />
          <MetricRow
            label="Debug Pipeline"
            value={h.debug_pipeline ? "enabled" : "disabled"}
            status={h.debug_pipeline ? "warning" : "ok"}
          />
        </div>
      </CardContent>
    </Card>
  );
}
