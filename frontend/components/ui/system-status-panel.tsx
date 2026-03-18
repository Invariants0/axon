"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Server,
  Database,
  BrainCircuit,
  Activity,
  Cpu,
  Clock,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
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
    ok: "text-emerald-400",
    error: "text-red-400",
    warning: "text-yellow-400",
    neutral: "text-white/60",
  };

  const dotColors = {
    ok: "bg-emerald-400 shadow-[0_0_5px_rgba(16,185,129,0.5)]",
    error: "bg-red-400",
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

export function SystemStatusPanel() {
  const { systemHealth, setSystemHealth } = useAppStore();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchStatus = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const health = await systemService.health();
      setSystemHealth(health);
      setLastRefresh(new Date());
    } catch (err) {
      setSystemHealth({ status: "offline" });
    } finally {
      setIsRefreshing(false);
    }
  }, [setSystemHealth]);

  // Initial fetch + auto-refresh every 15s
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const h: SystemHealth = systemHealth ?? { status: "connecting" };

  const overallStatus = h.status ?? "connecting";
  const statusConfig = {
    healthy: { label: "Online", color: "text-emerald-400", bgDot: "bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.6)]" },
    degraded: { label: "Degraded", color: "text-yellow-400", bgDot: "bg-yellow-400" },
    offline: { label: "Offline", color: "text-red-400", bgDot: "bg-red-400" },
    connecting: { label: "Connecting…", color: "text-white/40", bgDot: "bg-white/20 animate-pulse" },
  };

  const cfg = statusConfig[overallStatus] ?? statusConfig.connecting;
  const dbStatus = h.db_status ?? h.dbStatus ?? "connecting";
  const workersActive = h.workers_active ?? h.workersActive ?? 0;
  const llm = h.llm_provider ?? (h.llmProviders?.[0]) ?? "unknown";
  const skillsCount = h.skills_count ?? 0;

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
          <div className={`w-2.5 h-2.5 rounded-full ${cfg.bgDot}`} />
          <div>
            <div className={`font-medium text-sm ${cfg.color}`}>{cfg.label}</div>
            {lastRefresh && (
              <div className="text-[10px] text-white/30">
                Updated {lastRefresh.toLocaleTimeString()}
              </div>
            )}
          </div>
          {h.version && (
            <div className="ml-auto text-[10px] font-mono text-white/40 bg-white/5 px-2 py-1 rounded border border-white/5">
              {h.version}
            </div>
          )}
        </div>

        {/* Metrics */}
        <div className="space-y-0">
          <MetricRow
            label="Database"
            value={dbStatus === "connected" ? "Connected" : dbStatus}
            status={dbStatus === "connected" ? "ok" : "error"}
          />
          {h.vector_store && (
            <MetricRow
              label="Vector Store"
              value={h.vector_store}
              status="ok"
            />
          )}
          <MetricRow
            label="Inference Engine"
            value={llm}
            status={llm !== "unknown" ? "ok" : "warning"}
          />
          <MetricRow
            label="Active Workers"
            value={workersActive > 0 ? `${workersActive} running` : "0"}
            status={workersActive > 0 ? "ok" : "neutral"}
          />
          {skillsCount > 0 && (
            <MetricRow label="Skills Loaded" value={String(skillsCount)} status="ok" />
          )}
          {h.queue_size !== undefined && (
            <MetricRow
              label="Task Queue"
              value={h.queue_size === 0 ? "Empty" : `${h.queue_size} pending`}
              status={h.queue_size === 0 ? "ok" : "warning"}
            />
          )}
          {h.circuit_breaker && (
            <MetricRow
              label="Circuit Breaker"
              value={h.circuit_breaker}
              status={h.circuit_breaker === "closed" ? "ok" : "warning"}
            />
          )}
          {h.uptime_seconds !== undefined && (
            <MetricRow
              label="Uptime"
              value={formatUptime(h.uptime_seconds)}
              status="neutral"
            />
          )}
        </div>

        {/* LLM Providers */}
        {h.llmProviders && h.llmProviders.length > 1 && (
          <div className="pt-2 border-t border-white/5">
            <div className="text-[10px] uppercase tracking-wider text-white/30 mb-2">
              Available Providers
            </div>
            <div className="flex flex-wrap gap-1.5">
              {h.llmProviders.map((p) => (
                <span
                  key={p}
                  className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/60"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function formatUptime(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  return `${Math.round(seconds / 3600)}h ${Math.round((seconds % 3600) / 60)}m`;
}
