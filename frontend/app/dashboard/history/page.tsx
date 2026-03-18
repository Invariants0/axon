"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  History,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Download,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppStore } from "@/store/app-store";
import { tasksService } from "@/lib/services/tasks.service";
import type { Task } from "@/types";

const STATUS_BADGE: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  completed: { label: "Completed", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: <CheckCircle2 className="w-3 h-3" /> },
  success:   { label: "Success",   cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: <CheckCircle2 className="w-3 h-3" /> },
  failed:    { label: "Failed",    cls: "bg-red-500/10    text-red-400    border-red-500/20",    icon: <XCircle className="w-3 h-3" /> },
  fail:      { label: "Failed",    cls: "bg-red-500/10    text-red-400    border-red-500/20",    icon: <XCircle className="w-3 h-3" /> },
  running:   { label: "Running",   cls: "bg-blue-500/10   text-blue-400   border-blue-500/20   animate-pulse", icon: <Loader2 className="w-3 h-3 animate-spin" /> },
  queued:    { label: "Queued",    cls: "bg-amber-500/10  text-amber-400  border-amber-500/20",  icon: <Clock className="w-3 h-3" /> },
  pending:   { label: "Pending",   cls: "bg-amber-500/10  text-amber-400  border-amber-500/20",  icon: <Clock className="w-3 h-3" /> },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_BADGE[status] ?? STATUS_BADGE.queued;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cfg.cls}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

function fmtDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
}

type StatusFilter = "all" | "completed" | "failed" | "running" | "queued";

export default function HistoryPage() {
  const router = useRouter();
  const { tasks, setTasks } = useAppStore();
  const [search, setSearch]       = useState("");
  const [statusFilter, setFilter] = useState<StatusFilter>("all");
  const [loading, setLoading]     = useState(false);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await tasksService.list();
      if (Array.isArray(data)) setTasks(data as Task[]);
    } catch { /* backend may not be running */ }
    finally { setLoading(false); }
  };

  useEffect(() => { loadTasks(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      const matchSearch =
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.id.toLowerCase().includes(search.toLowerCase());
      const matchStatus =
        statusFilter === "all" ||
        t.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [tasks, search, statusFilter]);

  const exportCSV = () => {
    const rows = [
      ["ID", "Title", "Status", "Created", "Updated"],
      ...filtered.map((t) => [t.id, t.title, t.status, t.created_at, t.updated_at]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "axon_history.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full p-6 flex flex-col gap-5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-display font-bold">Task History</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {tasks.length} total {tasks.length === 1 ? "task" : "tasks"} — click any row to view details
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={loadTasks}
            disabled={loading}
            className="text-white/40 hover:text-white border border-white/10 gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={exportCSV}
            disabled={filtered.length === 0}
            className="text-white/40 hover:text-white border border-white/10 gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <Input
            placeholder="Search by title or ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 h-9"
          />
        </div>
        <div className="flex items-center gap-1.5">
          {(["all", "completed", "running", "failed", "queued"] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wide transition-colors ${
                statusFilter === s
                  ? "bg-white/[0.08] text-white/90"
                  : "text-white/30 hover:text-white/60 hover:bg-white/[0.04]"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card className="flex-1 border-white/[0.06] bg-[#0a0a0a]/80 backdrop-blur-xl flex flex-col overflow-hidden">
        <ScrollArea className="flex-1">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-[#0a0a0a]/95 backdrop-blur border-b border-white/[0.05]">
              <tr>
                <th className="text-left px-5 py-3 text-[10px] uppercase tracking-[0.12em] text-white/30 font-semibold w-36">ID</th>
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-[0.12em] text-white/30 font-semibold">Title</th>
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-[0.12em] text-white/30 font-semibold w-28">Status</th>
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-[0.12em] text-white/30 font-semibold w-36 hidden lg:table-cell">Created</th>
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-[0.12em] text-white/30 font-semibold w-36 hidden lg:table-cell">Updated</th>
                <th className="w-12 px-3 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              <AnimatePresence initial={false}>
                {loading && filtered.length === 0
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={6} className="px-5 py-3">
                          <div className="h-5 bg-white/[0.04] rounded animate-pulse" />
                        </td>
                      </tr>
                    ))
                  : filtered.length > 0
                  ? filtered.map((task) => (
                      <motion.tr
                        key={task.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-white/[0.025] transition-colors cursor-pointer group"
                        onClick={() => router.push(`/dashboard/task/${task.id}`)}
                      >
                        <td className="px-5 py-3.5">
                          <span className="font-mono text-[10px] text-white/30 group-hover:text-white/50 transition-colors">
                            {task.id.slice(0, 8)}…
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">
                            {task.title ?? "Untitled"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusBadge status={task.status} />
                        </td>
                        <td className="px-4 py-3.5 hidden lg:table-cell">
                          <span className="text-[11px] font-mono text-white/30">{fmtDate(task.created_at)}</span>
                        </td>
                        <td className="px-4 py-3.5 hidden lg:table-cell">
                          <span className="text-[11px] font-mono text-white/30">{fmtDate(task.updated_at)}</span>
                        </td>
                        <td className="px-3 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link
                              href={`/dashboard/execution/${task.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-white/30 hover:text-primary transition-colors"
                              title="Live execution"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                            <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-primary transition-colors" />
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  : (
                      <tr>
                        <td colSpan={6} className="px-5 py-16 text-center text-white/25 text-sm italic">
                          {search ? `No tasks match "${search}"` : "No task history yet. Submit a task from the Control Room."}
                        </td>
                      </tr>
                    )}
              </AnimatePresence>
            </tbody>
          </table>
        </ScrollArea>
        {filtered.length > 0 && (
          <div className="shrink-0 px-5 py-2.5 border-t border-white/[0.04] text-[10px] font-mono text-white/25">
            Showing {filtered.length} of {tasks.length} tasks
          </div>
        )}
      </Card>
    </div>
  );
}
