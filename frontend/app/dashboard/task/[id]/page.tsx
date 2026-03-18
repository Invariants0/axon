"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Copy,
  RefreshCw,
  ExternalLink,
  Terminal,
  Cpu,
  Layers,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { tasksService } from "@/lib/services/tasks.service";
import type { Task, TaskTimeline, AgentExecution } from "@/types";

const AGENT_COLORS: Record<string, string> = {
  planning:  "text-blue-400   border-blue-400/30  bg-blue-400/[0.06]",
  research:  "text-amber-400  border-amber-400/30 bg-amber-400/[0.06]",
  reasoning: "text-violet-400 border-violet-400/30 bg-violet-400/[0.06]",
  builder:   "text-emerald-400 border-emerald-400/30 bg-emerald-400/[0.06]",
};

const AGENT_ORDER = ["planning", "research", "reasoning", "builder"];

function agentKey(name: string) {
  return AGENT_ORDER.find((k) => name.toLowerCase().includes(k)) ?? name;
}

function fmtDuration(ms?: number) {
  if (!ms) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function fmtDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function StatusBadge({ status }: { status: Task["status"] }) {
  const cfg: Record<string, { label: string; class: string; icon: React.ReactNode }> = {
    completed: { label: "Completed", class: "text-emerald-400 border-emerald-500/30 bg-emerald-500/[0.06]", icon: <CheckCircle2 className="w-3 h-3" /> },
    success:   { label: "Completed", class: "text-emerald-400 border-emerald-500/30 bg-emerald-500/[0.06]", icon: <CheckCircle2 className="w-3 h-3" /> },
    running:   { label: "Running",   class: "text-blue-400   border-blue-500/30   bg-blue-500/[0.06]",   icon: <Loader2    className="w-3 h-3 animate-spin" /> },
    queued:    { label: "Queued",    class: "text-amber-400  border-amber-500/30  bg-amber-500/[0.06]",  icon: <Clock      className="w-3 h-3" /> },
    pending:   { label: "Pending",   class: "text-amber-400  border-amber-500/30  bg-amber-500/[0.06]",  icon: <Clock      className="w-3 h-3" /> },
    failed:    { label: "Failed",    class: "text-red-400    border-red-500/30    bg-red-500/[0.06]",    icon: <XCircle    className="w-3 h-3" /> },
    fail:      { label: "Failed",    class: "text-red-400    border-red-500/30    bg-red-500/[0.06]",    icon: <XCircle    className="w-3 h-3" /> },
  };
  const c = cfg[status] ?? cfg.queued;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${c.class}`}>
      {c.icon} {c.label}
    </span>
  );
}

function AgentStageRow({ exec, maxMs }: { exec: AgentExecution; maxMs: number }) {
  const key = agentKey(exec.agent_name);
  const color = AGENT_COLORS[key] ?? "text-white/50 border-white/10 bg-white/[0.03]";
  const pct = maxMs > 0 ? Math.min(100, ((exec.duration_ms ?? 0) / maxMs) * 100) : 5;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-center gap-4 p-3.5 rounded-xl border ${color}`}
    >
      <div className="w-24 shrink-0">
        <p className="text-[10px] uppercase tracking-[0.12em] opacity-60 font-semibold">
          {key}
        </p>
      </div>
      <div className="flex-1 h-2 bg-black/30 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 bg-current opacity-40"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="w-16 text-right">
        <span className="text-[11px] font-mono font-semibold">
          {fmtDuration(exec.duration_ms)}
        </span>
      </div>
      {exec.error_message ? (
        <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
      ) : exec.end_time ? (
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
      ) : (
        <Loader2 className="w-3.5 h-3.5 animate-spin opacity-50 shrink-0" />
      )}
    </motion.div>
  );
}

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [task, setTask] = useState<Task | null>(null);
  const [timeline, setTimeline] = useState<TaskTimeline | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    Promise.all([
      tasksService.get(id),
      tasksService.timeline(id).catch(() => null),
    ])
      .then(([t, tl]) => {
        setTask(t as Task);
        setTimeline(tl as TaskTimeline | null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load task"))
      .finally(() => setLoading(false));
  }, [id]);

  const copyResult = () => {
    if (!task?.result) return;
    navigator.clipboard.writeText(task.result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const retryTask = async () => {
    if (!task) return;
    try {
      const newTask = await tasksService.create({ title: task.title, description: task.description });
      router.push(`/dashboard/task/${(newTask as Task).id}`);
    } catch {
      /* ignore */
    }
  };

  const executions = timeline?.executions ?? [];
  const maxMs = Math.max(...executions.map((e) => e.duration_ms ?? 0), 1);
  const totalMs = timeline?.total_duration_ms ?? executions.reduce((s, e) => s + (e.duration_ms ?? 0), 0);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 text-primary/60 animate-spin mx-auto" />
          <p className="text-sm text-white/30">Loading task…</p>
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center space-y-4 max-w-md">
          <XCircle className="w-12 h-12 text-red-400/50 mx-auto" />
          <h2 className="text-lg font-display font-bold text-white/80">Task Not Found</h2>
          <p className="text-sm text-white/40">{error ?? "The requested task could not be loaded."}</p>
          <Link href="/dashboard">
            <Button variant="outline" className="border-white/10 text-white/60 hover:text-white/90 hover:bg-white/5">
              ← Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-start gap-4">
          <Link href="/dashboard">
            <Button size="icon" variant="ghost" className="text-white/40 hover:text-white/80 hover:bg-white/[0.04] shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <p className="text-[10px] font-mono text-white/30 uppercase tracking-[0.15em]">
                {task.id.slice(0, 12)}…
              </p>
              <StatusBadge status={task.status} />
            </div>
            <h1 className="text-2xl font-display font-bold text-white mt-1.5 leading-tight">
              {task.title}
            </h1>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link href={`/dashboard/execution/${task.id}`}>
              <Button size="sm" variant="outline" className="border-white/10 text-white/50 hover:text-white/90 hover:bg-white/[0.04] gap-1.5 text-xs">
                <ExternalLink className="w-3 h-3" />
                Live View
              </Button>
            </Link>
          </div>
        </div>

        {/* Meta + Timeline grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left: Meta */}
          <div className="lg:col-span-1 space-y-3">
            {/* Info Card */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-white/40 uppercase tracking-[0.12em]">
                <Layers className="w-3.5 h-3.5" />
                Task Info
              </div>
              <div className="space-y-2.5 text-sm">
                <InfoRow label="Created" value={fmtDate(task.created_at)} />
                <InfoRow label="Updated" value={fmtDate(task.updated_at)} />
                <InfoRow label="Duration" value={fmtDuration(totalMs || undefined)} />
                <InfoRow label="Trace ID" value={task.trace_id?.slice(0, 12) ?? "—"} mono />
              </div>
            </div>

            {/* Description */}
            {task.description && (
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-2">
                <p className="text-[10px] uppercase tracking-[0.12em] text-white/30 font-semibold">Description</p>
                <p className="text-sm text-white/60 leading-relaxed">{task.description}</p>
              </div>
            )}
          </div>

          {/* Right: Execution Timeline */}
          <div className="lg:col-span-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-white/40 uppercase tracking-[0.12em]">
                <Cpu className="w-3.5 h-3.5" />
                Execution Pipeline
              </div>
              {totalMs > 0 && (
                <span className="text-[10px] font-mono text-white/30">
                  Total: {fmtDuration(totalMs)}
                </span>
              )}
            </div>

            <div className="space-y-2">
              {executions.length > 0 ? (
                executions.map((exec) => (
                  <AgentStageRow key={exec.id} exec={exec} maxMs={maxMs} />
                ))
              ) : (
                /* Skeleton placeholder stages when no timeline data */
                AGENT_ORDER.map((agent) => (
                  <div
                    key={agent}
                    className="flex items-center gap-4 p-3.5 rounded-xl border border-white/[0.04] bg-white/[0.01]"
                  >
                    <div className="w-24 shrink-0">
                      <p className="text-[10px] uppercase tracking-[0.12em] text-white/20 font-semibold">{agent}</p>
                    </div>
                    <div className="flex-1 h-2 bg-black/20 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-white/5 w-1/3" />
                    </div>
                    <span className="text-[11px] font-mono text-white/20 w-16 text-right">—</span>
                    <Clock className="w-3.5 h-3.5 text-white/15 shrink-0" />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Result / Error */}
        {(task.result || task.error) && (
          <div className={`rounded-xl border p-5 space-y-3 ${
            task.error
              ? "border-red-500/20 bg-red-500/[0.04]"
              : "border-emerald-500/20 bg-emerald-500/[0.04]"
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em]
                              text-white/40">
                <Terminal className="w-3.5 h-3.5" />
                {task.error ? "Error Output" : "Task Result"}
              </div>
              {task.result && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={copyResult}
                  className="text-white/30 hover:text-white/70 gap-1.5 text-xs h-7 px-2"
                >
                  <Copy className="w-3 h-3" />
                  {copied ? "Copied!" : "Copy"}
                </Button>
              )}
            </div>
            <pre className={`text-sm font-mono leading-relaxed whitespace-pre-wrap break-words ${
              task.error ? "text-red-400/80" : "text-white/80"
            }`}>
              {task.error ?? task.result}
            </pre>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <Button
            onClick={retryTask}
            className="bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-white/70 gap-2"
            variant="ghost"
          >
            <RefreshCw className="w-4 h-4" />
            Retry Task
          </Button>
          <Link href={`/dashboard/execution/${task.id}`}>
            <Button
              className="bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary gap-2"
              variant="ghost"
            >
              <Terminal className="w-4 h-4" />
              View Live Execution
            </Button>
          </Link>
        </div>
      </div>
    </ScrollArea>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-white/30 text-xs shrink-0">{label}</span>
      <span className={`text-white/70 truncate ${mono ? "font-mono text-xs" : ""}`}>{value}</span>
    </div>
  );
}
