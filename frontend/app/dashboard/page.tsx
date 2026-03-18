"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Terminal,
  Sparkles,
  User,
  BrainCircuit,
  Zap,
  Activity,
  Network,
  ArrowRight,
  Clock,
  Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppStore } from "@/store/app-store";
import { useAxonWebSocket } from "@/hooks/use-axon-websocket";
import { tasksService } from "@/lib/services/tasks.service";
import { skillsService } from "@/lib/services/skills.service";
import { evolutionService } from "@/lib/services/evolution.service";
import type { ChatMessage } from "@/types";

// ─── Main Dashboard Page ──────────────────────────────────────
export default function DashboardPage() {
  useAxonWebSocket();

  const {
    logs,
    skills,
    tasks,
    version,
    isEvolutionActive,
    evolutionState,
    addTask,
    setEvolutionActive,
    setSkillDetails,
    setEvolutionState,
    addLog,
    addNotification,
  } = useAppStore();


  // Hydrate on mount
  useEffect(() => {
    tasksService.list(20).then((data) => {
      if (Array.isArray(data)) data.forEach((t) => addTask(t));
    }).catch(() => {});

    skillsService.list().then((data) => {
      if (Array.isArray(data) && data.length > 0) setSkillDetails(data);
    }).catch(() => {});

    evolutionService.getStatus().then(setEvolutionState).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const recentTasks = tasks.slice(0, 5);
  const runningTasks = tasks.filter((t) => t.status === "running").length;
  const completedTasks = tasks.filter((t) => t.status === "completed").length;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Top Stats Bar */}
      <div className="shrink-0 px-5 py-3 border-b border-white/[0.04] bg-black/20">
        <div className="flex items-center gap-6">
          <StatChip icon={<Cpu className="w-3 h-3" />} label="Version" value={version} accent />
          <StatChip icon={<Activity className="w-3 h-3" />} label="Running" value={String(runningTasks)} />
          <StatChip icon={<Sparkles className="w-3 h-3" />} label="Completed" value={String(completedTasks)} color="text-emerald-400" />
          <StatChip icon={<Network className="w-3 h-3" />} label="Skills" value={String(skills.length)} color="text-blue-400" />
          <StatChip
            icon={<Zap className="w-3 h-3" />}
            label="Evolution"
            value={isEvolutionActive ? "Active" : "Idle"}
            color={isEvolutionActive ? "text-primary" : "text-white/40"}
          />
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 min-h-0 overflow-hidden">
        {/* LEFT: Control Room Chat */}
        <div className="lg:col-span-4 xl:col-span-4 border-r border-white/[0.04] flex flex-col min-h-0">
          <ControlRoomChat />
        </div>

        {/* CENTER: Live Terminal */}
        <div className="lg:col-span-5 xl:col-span-5 flex flex-col min-h-0 border-r border-white/[0.04]">
          <LiveTerminal />
        </div>

        {/* RIGHT: Panels */}
        <div className="lg:col-span-3 xl:col-span-3 flex flex-col min-h-0 overflow-y-auto">
          <RightPanel />
        </div>
      </div>
    </div>
  );
}

// ─── Stat Chip ────────────────────────────────────────────────
function StatChip({
  icon,
  label,
  value,
  accent,
  color = "text-white/80",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: boolean;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className={`${accent ? "text-primary" : "text-white/30"}`}>{icon}</div>
      <span className="text-[10px] uppercase tracking-[0.1em] text-white/30 hidden xl:inline">{label}</span>
      <span className={`text-xs font-mono font-semibold ${color}`}>{value}</span>
    </div>
  );
}

// ─── Control Room Chat ─────────────────────────────────────────
function ControlRoomChat() {
  const { isEvolutionActive, setEvolutionActive, addNotification, addTask } = useAppStore();
  const [messages, setMessages] = useState<(ChatMessage & { taskId?: string })[]>([
    {
      id: "init",
      role: "system",
      content: "AXON Orchestrator online. Submit a task to begin execution pipeline.",
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = { current: null as HTMLDivElement | null };

  const handleSend = useCallback(async () => {
    const cmd = input.trim();
    if (!cmd) return;
    setInput("");

    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: "user", content: cmd, timestamp: Date.now() },
    ]);

    const agentId = `a-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: agentId, role: "agent", content: "Dispatching to inference pipeline…", timestamp: Date.now(), isStreaming: true },
    ]);

    if (!isEvolutionActive) setEvolutionActive(true);
    setIsLoading(true);

    try {
      const task = await tasksService.create({ title: cmd });
      addTask({ ...task, name: task.title, version: "v0", time: "" } as any);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === agentId
            ? {
                ...m,
                content: `✓ Task "${task.title ?? cmd}" dispatched.\n\nView details: /dashboard/task/${task.id}`,
                isStreaming: false,
                taskId: task.id,
              }
            : m
        )
      );
      addNotification(`Task created: "${task.title ?? cmd}"`, "success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === agentId
            ? { ...m, content: `✗ Failed to dispatch: ${msg}`, isStreaming: false }
            : m
        )
      );
      addNotification(`Task dispatch failed: ${msg}`, "error");
    } finally {
      setIsLoading(false);
    }
  }, [input, isEvolutionActive, setEvolutionActive, addNotification, addTask]);

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.01]">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-white/90">Control Room</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            {isEvolutionActive && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
            )}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isEvolutionActive ? "bg-emerald-500" : "bg-white/20"}`} />
          </span>
          <span className="text-[9px] text-white/40 uppercase tracking-[0.15em]">
            {isEvolutionActive ? "Connected" : "Standby"}
          </span>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-3">
        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role !== "user" && (
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border
                    ${msg.role === "system"
                      ? "bg-white/[0.04] border-white/[0.08] text-white/40"
                      : "bg-primary/10 border-primary/20 text-primary"
                    }`}
                  >
                    {msg.role === "system" ? <Terminal className="w-3.5 h-3.5" /> : <BrainCircuit className="w-3.5 h-3.5" />}
                  </div>
                )}

                <div className={`relative px-3 py-2.5 rounded-2xl max-w-[85%] text-[13px] leading-relaxed
                  ${msg.role === "user"
                    ? "bg-white text-black font-medium rounded-tr-sm"
                    : msg.role === "system"
                    ? "bg-white/[0.03] text-white/50 font-mono text-xs border border-white/[0.06]"
                    : "bg-white/[0.04] text-white/85 border border-white/[0.06] rounded-tl-sm"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{(msg as any).taskId
                    ? msg.content.split("\n\n")[0]
                    : msg.content}</p>
                  {(msg as any).taskId && (
                    <Link
                      href={`/dashboard/task/${(msg as any).taskId}`}
                      className="inline-flex items-center gap-1 mt-2 text-primary text-[11px] hover:underline font-medium"
                    >
                      View Task Details <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                  {msg.isStreaming && (
                    <span className="inline-block w-1.5 h-3.5 bg-primary ml-1.5 animate-pulse align-middle rounded-sm" />
                  )}
                </div>

                {msg.role === "user" && (
                  <div className="w-7 h-7 rounded-full bg-white/[0.06] border border-white/[0.1] flex items-center justify-center shrink-0">
                    <User className="w-3.5 h-3.5 text-white/60" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t border-white/[0.06] bg-black/30">
        <form
          className="relative flex items-center"
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
        >
          <Sparkles className="w-4 h-4 absolute left-3.5 text-primary/60 pointer-events-none" />
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Command AXON to execute a task…"
            disabled={isLoading}
            className="w-full bg-white/[0.03] border-white/[0.08] placeholder:text-white/20 text-white pl-10 pr-12 py-5 rounded-xl hover:bg-white/[0.05] focus:bg-white/[0.05] transition-colors focus-visible:ring-1 focus-visible:ring-primary/40"
          />
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            size="icon"
            className="absolute right-2 h-8 w-8 rounded-lg bg-white hover:bg-white/90 text-black transition-all disabled:opacity-30"
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </form>
      </div>
    </div>
  );
}

// ─── Live Terminal ─────────────────────────────────────────────
function LiveTerminal() {
  const { logs } = useAppStore();
  const displayLogs = logs.slice(-100);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.01]">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-semibold text-white/90">Live Agent Stream</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
          <span className="text-[9px] text-white/30 uppercase tracking-[0.15em] font-mono">{displayLogs.length} events</span>
        </div>
      </div>

      <ScrollArea className="flex-1 font-mono text-xs">
        <div className="p-4 space-y-0.5">
          {displayLogs.length === 0 ? (
            <div className="text-white/20 text-center py-20">
              <Terminal className="w-6 h-6 mx-auto mb-3 opacity-30" />
              <p>Waiting for agent activity…</p>
            </div>
          ) : (
            displayLogs.map((log, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.15 }}
                className={`py-1 px-2 rounded leading-relaxed ${getLogStyle(log)}`}
              >
                {log}
              </motion.div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function getLogStyle(log: string): string {
  const l = log.toUpperCase();
  if (l.includes("[SUCCESS]") || l.includes("✓")) return "text-emerald-400/80";
  if (l.includes("[FAILURE]") || l.includes("[ERROR]") || l.includes("✗")) return "text-red-400/80 bg-red-500/[0.04]";
  if (l.includes("[EVOLUTION]") || l.includes("⚡")) return "text-primary/90 bg-primary/[0.04]";
  if (l.includes("[SKILL]")) return "text-blue-400/80";
  if (l.includes("[TASK]")) return "text-amber-400/70";
  if (l.includes("[SYSTEM]")) return "text-white/40";
  if (l.includes("[REASONING]") || l.includes("[PLANNING]")) return "text-cyan-400/70";
  return "text-white/50";
}

// ─── Right Panel ──────────────────────────────────────────────
function RightPanel() {
  const {
    skills,
    evolutionState,
    evolutionHistory,
    isEvolutionActive,
    setEvolutionState,
    addLog,
    addNotification,
  } = useAppStore();
  const [triggering, setTriggering] = useState(false);

  const triggerEvolution = useCallback(async () => {
    setTriggering(true);
    addLog("[EVOLUTION] ⚡ Manual evolution cycle triggered…");
    try {
      await evolutionService.trigger();
      addNotification("Evolution cycle triggered", "info");
    } catch (err) {
      addNotification("Failed to trigger evolution", "error");
    } finally {
      setTriggering(false);
    }
  }, [addLog, addNotification]);

  const CORE_SKILLS = ["reasoning", "planning", "coding"];

  return (
    <div className="flex flex-col h-full">
      {/* Evolution Engine */}
      <div className="p-4 border-b border-white/[0.04] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className={`w-4 h-4 ${isEvolutionActive ? "text-primary animate-pulse" : "text-white/30"}`} />
            <span className="text-sm font-semibold text-white/90">Evolution Engine</span>
          </div>
          <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border ${
            isEvolutionActive
              ? "text-primary bg-primary/10 border-primary/20"
              : "text-white/30 bg-white/[0.03] border-white/[0.06]"
          }`}>
            {evolutionState?.status ?? "idle"}
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.05]">
            <div className="text-[9px] uppercase tracking-[0.12em] text-white/30 mb-1">Generated</div>
            <div className="text-lg font-mono font-bold text-emerald-400">{evolutionState?.generated_skills ?? 0}</div>
          </div>
          <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.05]">
            <div className="text-[9px] uppercase tracking-[0.12em] text-white/30 mb-1">Failed</div>
            <div className="text-lg font-mono font-bold text-red-400">{evolutionState?.failed_tasks ?? 0}</div>
          </div>
        </div>

        <Button
          className="w-full bg-gradient-to-r from-primary/70 to-purple-600/70 hover:from-primary hover:to-purple-600 text-white text-xs h-9 border-0 shadow-[0_0_15px_rgba(168,85,247,0.15)] disabled:opacity-40"
          disabled={isEvolutionActive || triggering}
          onClick={triggerEvolution}
        >
          {triggering ? "Triggering…" : isEvolutionActive ? "Evolving…" : "Trigger Evolution Cycle"}
        </Button>
      </div>

      {/* Skills */}
      <div className="p-4 border-b border-white/[0.04] space-y-3 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-semibold text-white/90">Capability Graph</span>
          </div>
          <span className="text-[10px] font-mono text-white/30">{skills.length} loaded</span>
        </div>

        <div className="space-y-1.5">
          <AnimatePresence>
            {skills.map((skill) => {
              const isNew = !CORE_SKILLS.includes(skill);
              return (
                <motion.div
                  key={skill}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex items-center gap-2.5 p-2.5 rounded-lg border transition-colors ${
                    isNew
                      ? "border-emerald-500/20 bg-emerald-500/[0.04] shadow-[0_0_10px_rgba(16,185,129,0.05)]"
                      : "border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.03]"
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    isNew ? "bg-emerald-400 shadow-[0_0_4px_rgba(16,185,129,0.6)]" : "bg-white/20"
                  }`} />
                  <span className={`text-xs font-mono font-medium ${isNew ? "text-emerald-400" : "text-white/60"}`}>
                    {skill}
                  </span>
                  {isNew && (
                    <span className="ml-auto text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                      New
                    </span>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Timeline */}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-white/30" />
          <span className="text-sm font-semibold text-white/90">Version Timeline</span>
        </div>

        {evolutionHistory.length > 0 ? (
          <div className="space-y-2">
            {evolutionHistory.slice(-3).reverse().map((entry, i) => (
              <div key={i} className="flex items-start gap-3 p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0 shadow-[0_0_4px_rgba(168,85,247,0.5)]" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-primary">{entry.version}</span>
                    <span className="text-[9px] font-mono text-white/20">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                  </div>
                  {entry.skills_added.length > 0 && (
                    <p className="text-[10px] text-white/40 mt-0.5">+{entry.skills_added.join(", ")}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-xs text-white/20">No evolution history yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
