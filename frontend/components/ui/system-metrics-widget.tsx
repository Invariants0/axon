"use client";

import { useEffect, useState, useCallback } from "react";
import { Server, Database, BrainCircuit, Activity, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { systemApi } from "@/lib/api-client";
import { useAppStore } from "@/store/app-store";
import type { SystemHealth } from "@/types";

export function SystemMetricsWidget() {
  const { systemHealth, setSystemHealth } = useAppStore();
  const [isLoading, setIsLoading] = useState(!systemHealth);

  const fetchHealth = useCallback(async () => {
    try {
      const h = await systemApi.health();
      setSystemHealth(h);
    } catch {
      setSystemHealth({ status: "offline" });
    } finally {
      setIsLoading(false);
    }
  }, [setSystemHealth]);

  useEffect(() => {
    if (!systemHealth) fetchHealth();
    const interval = setInterval(fetchHealth, 20000);
    return () => clearInterval(interval);
  }, [fetchHealth, systemHealth]);

  const h: SystemHealth = systemHealth ?? {
    status: "connecting",
    workersActive: 0,
    dbStatus: "connecting",
    llmProviders: [],
  };

  const status = h.status ?? "connecting";
  const dbState = h.db_status ?? h.dbStatus ?? "connecting";
  const workers = h.workers_active ?? h.workersActive ?? 0;
  const llm = h.llm_provider ?? h.llmProviders?.[0] ?? "—";

  const statusDot = {
    healthy: "bg-emerald-500 animate-pulse shadow-[0_0_5px_rgba(16,185,129,0.8)]",
    degraded: "bg-yellow-500",
    offline: "bg-red-500",
    connecting: "bg-white/20 animate-pulse",
  }[status] ?? "bg-white/20";

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
        {/* Backend Node */}
        <div className="flex flex-col gap-1 p-3 rounded-md bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 text-xs font-medium text-white/80">
            <Server className="w-3 h-3 text-emerald-400" />
            Backend
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />
            <span className="text-[10px] uppercase tracking-widest text-emerald-500 flex-1 capitalize">
              {status}
            </span>
          </div>
          {h.uptime_seconds != null && (
            <p className="text-[10px] font-mono text-white/30 mt-0.5">
              up {formatUptime(h.uptime_seconds)}
            </p>
          )}
        </div>

        {/* Database Node */}
        <div className="flex flex-col gap-1 p-3 rounded-md bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 text-xs font-medium text-white/80">
            <Database className="w-3 h-3 text-purple-400" />
            Vector DB
          </div>
          <p className="text-lg font-mono font-bold text-white tracking-tight">
            {h.vector_store ?? "Qdrant"}
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                dbState === "connected" ? "bg-emerald-500" : "bg-yellow-500"
              }`}
            />
            <span className="text-[10px] uppercase tracking-widest text-white/50">
              {dbState}
            </span>
          </div>
        </div>

        {/* Workers / Inference Node */}
        <div className="flex flex-col gap-1 p-3 rounded-md bg-white/5 border border-white/10 col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-medium text-white/80">
              <BrainCircuit className="w-3 h-3 text-yellow-400" />
              Inference
            </div>
            <div className="text-[10px] text-white/50 capitalize">{llm}</div>
          </div>

          <div className="flex items-end gap-2 mt-2">
            <p className="text-lg font-mono font-bold text-white tracking-tight">
              {workers}
              <span className="text-xs font-medium text-white/40 ml-1">workers</span>
            </p>
          </div>
          <div className="h-1 w-full bg-white/10 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-yellow-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(workers * 14, 100)}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function formatUptime(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}
