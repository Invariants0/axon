"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Activity,
  Loader2,
  RefreshCw,
  Search,
  Eye,
  ChevronRight,
  Terminal,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { tasksService } from "@/lib/services/tasks.service";
import { useAppStore } from "@/store/app-store";
import type { Task, TaskStatus, TaskTimeline } from "@/types";

// ─── Status Badge ─────────────────────────────────────────────

const STATUS = {
  queued: { label: "Queued", classes: "bg-white/10 text-white/60 border-white/10" },
  pending: { label: "Pending", classes: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  "in-progress": { label: "Running", classes: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  running: { label: "Running", classes: "bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse" },
  completed: { label: "Completed", classes: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  success: { label: "Success", classes: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  failed: { label: "Failed", classes: "bg-red-500/10 text-red-400 border-red-500/20" },
  fail: { label: "Failed", classes: "bg-red-500/10 text-red-400 border-red-500/20" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS[status as keyof typeof STATUS] ?? STATUS.queued;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${cfg.classes}`}>
      {cfg.label}
    </span>
  );
}

// ─── Task Detail Modal ────────────────────────────────────────

function TaskDetailModal({
  task,
  onClose,
}: {
  task: Task;
  onClose: () => void;
}) {
  const [timeline, setTimeline] = useState<TaskTimeline | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const close = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [onClose]);

  useEffect(() => {
    tasksService.timeline(task.id)
      .then(setTimeline)
      .catch(() => setTimeline(null))
      .finally(() => setLoading(false));
  }, [task.id]);

  const maxDuration = timeline
    ? Math.max(...timeline.executions.map((e) => e.duration_ms ?? 0), 1)
    : 1;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        className="bg-[#0d0d0d] border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[85vh]"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <StatusBadge status={task.status} />
              <span className="text-[10px] font-mono text-white/30">{task.id.slice(0, 12)}…</span>
            </div>
            <h2 className="text-white font-semibold text-lg leading-tight truncate">
              {task.title ?? task.name ?? "Untitled Task"}
            </h2>
            {task.description && (
              <p className="text-sm text-white/50 mt-1">{task.description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 text-white/30 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
          >
            <XCircleIcon />
          </button>
        </div>

        <ScrollArea className="flex-1 p-6 space-y-6">
          {/* Result / Error */}
          {(task.result || task.error) && (
            <div className={`p-4 rounded-xl text-sm font-mono border ${
              task.error
                ? "bg-red-950/30 border-red-500/20 text-red-300"
                : "bg-emerald-950/20 border-emerald-500/20 text-emerald-300"
            }`}>
              <div className="text-[10px] uppercase tracking-wider mb-2 opacity-60">
                {task.error ? "Error" : "Result"}
              </div>
              <pre className="whitespace-pre-wrap break-words">{task.error ?? task.result}</pre>
            </div>
          )}

          {/* Execution Timeline */}
          <div>
            <h3 className="text-xs uppercase tracking-wider text-white/30 mb-4 font-medium">
              Execution Timeline
            </h3>
            {loading ? (
              <div className="flex items-center gap-2 text-white/30 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading timeline...
              </div>
            ) : timeline?.executions.length ? (
              <div className="space-y-3">
                {timeline.executions.map((exec, i) => {
                  const pct = Math.round(((exec.duration_ms ?? 0) / maxDuration) * 100);
                  return (
                    <div key={exec.id ?? i} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium capitalize text-white/80">
                          {exec.agent_name}
                        </span>
                        <span className="font-mono text-white/40">
                          {exec.duration_ms != null ? `${exec.duration_ms}ms` : "—"}
                        </span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ delay: i * 0.1, duration: 0.5 }}
                          className="h-full bg-primary rounded-full"
                        />
                      </div>
                      {exec.error_message && (
                        <p className="text-[10px] text-red-400">{exec.error_message}</p>
                      )}
                    </div>
                  );
                })}
                {timeline.total_duration_ms != null && (
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-white/40">
                    <span>Total Duration</span>
                    <span className="font-mono">{timeline.total_duration_ms}ms</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-white/30 italic">No execution data available yet.</p>
            )}
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-white/30 mb-1">Created</div>
              <div className="text-xs font-mono text-white/60">
                {task.created_at ? new Date(task.created_at).toLocaleString() : "—"}
              </div>
            </div>
            {task.updated_at && (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-white/30 mb-1">Updated</div>
                <div className="text-xs font-mono text-white/60">
                  {new Date(task.updated_at).toLocaleString()}
                </div>
              </div>
            )}
            {task.trace_id && (
              <div className="col-span-2">
                <div className="text-[10px] uppercase tracking-wider text-white/30 mb-1">Trace ID</div>
                <div className="text-xs font-mono text-white/40 break-all">{task.trace_id}</div>
              </div>
            )}
          </div>
        </ScrollArea>
      </motion.div>
    </motion.div>
  );
}

// ─── Task List Component ──────────────────────────────────────

export function TaskList() {
  const router = useRouter();
  const { tasks, addTask, setTasks } = useAppStore();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | TaskStatus>("all");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await tasksService.list();
      if (Array.isArray(data)) {
        // Merge: add new ones, keep local real-time ones too
        const existingIds = new Set(tasks.map((t) => t.id));
        data.forEach((t) => {
          if (!existingIds.has(t.id)) {
            addTask({
              ...t,
              name: t.title,
              version: "v0",
              time: t.created_at ? new Date(t.created_at).toLocaleTimeString() : "",
            });
          }
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tasks");
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const filtered = tasks.filter((t) => {
    const matchesQuery =
      !query ||
      (t.title ?? t.name ?? "").toLowerCase().includes(query.toLowerCase()) ||
      t.id.toLowerCase().includes(query.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      t.status === statusFilter ||
      (statusFilter === "completed" && t.status === "success") ||
      (statusFilter === "failed" && t.status === "fail");
    return matchesQuery && matchesStatus;
  });

  return (
    <>
      <div className="h-full flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-display font-bold text-white">Task Execution</h2>
            <p className="text-sm text-white/50 mt-0.5">{tasks.length} task{tasks.length !== 1 ? "s" : ""} submitted</p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={loadTasks}
            disabled={isLoading}
            className="text-white/40 hover:text-white border border-white/10"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <Input
              placeholder="Search tasks..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="h-10 bg-white/5 border border-white/10 rounded-md px-3 text-xs text-white/60 outline-none"
          >
            <option value="all">All Status</option>
            <option value="running">Running</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="queued">Queued</option>
          </select>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-950/30 border border-red-500/20 text-red-400 text-xs">
            <Activity className="w-4 h-4 shrink-0" />
            <span>{error}</span>
            <button onClick={loadTasks} className="ml-auto underline">Retry</button>
          </div>
        )}

        {/* Table */}
        <Card className="flex-1 border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl overflow-hidden flex flex-col">
          <CardContent className="p-0 flex-1 over flow-hidden">
            <ScrollArea className="h-full">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-[#0a0a0a]/95 backdrop-blur border-b border-white/5">
                  <tr>
                    <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-white/30 font-medium w-28">
                      ID
                    </th>
                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-white/30 font-medium">
                      Task
                    </th>
                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-white/30 font-medium w-28">
                      Status
                    </th>
                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-white/30 font-medium w-36 hidden md:table-cell">
                      Created
                    </th>
                    <th className="w-16 px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  <AnimatePresence initial={false}>
                    {isLoading && filtered.length === 0 ? (
                      Array.from({ length: 4 }).map((_, i) => (
                        <tr key={i}>
                          <td colSpan={5} className="px-5 py-3">
                            <div className="h-5 bg-white/5 rounded animate-pulse" />
                          </td>
                        </tr>
                      ))
                    ) : filtered.length > 0 ? (
                      filtered.map((task) => (
                        <motion.tr
                          key={task.id}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                          onClick={() => router.push(`/dashboard/task/${task.id}`)}
                        >
                          <td className="px-5 py-3">
                            <span className="font-mono text-[10px] text-white/30">{task.id.slice(0, 8)}&hellip;</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm font-medium text-white/85 group-hover:text-white transition-colors">
                              {task.title ?? task.name ?? "Untitled"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={task.status} />
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <span className="text-[11px] font-mono text-white/30">
                              {task.created_at ? new Date(task.created_at).toLocaleTimeString() : task.time ?? "—"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button className="text-white/20 group-hover:text-primary transition-colors">
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </td>
                        </motion.tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-5 py-16 text-center text-white/30 text-sm italic">
                          {query ? `No tasks match "${query}"` : "No tasks yet. Submit a task from the Control Room."}
                        </td>
                      </tr>
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Task Detail Modal */}
      <AnimatePresence>
        {selectedTask && (
          <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} />
        )}
      </AnimatePresence>
    </>
  );
}

function XCircleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="m15 9-6 6"/>
      <path d="m9 9 6 6"/>
    </svg>
  );
}
