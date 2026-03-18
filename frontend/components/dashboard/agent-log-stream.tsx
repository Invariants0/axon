"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Pause, Play, Trash2 } from "lucide-react";
import { useAppStore } from "@/store/app-store";

// ─── Log Color Coding ─────────────────────────────────────────
function getLogStyle(line: string): string {
  const u = line.toUpperCase();
  if (u.includes("[PLANNING]"))       return "text-blue-400";
  if (u.includes("[RESEARCH]"))       return "text-amber-400";
  if (u.includes("[REASONING]"))      return "text-violet-400";
  if (u.includes("[BUILDER]") || u.includes("[BUILD]")) return "text-emerald-400";
  if (u.includes("[SUCCESS]") || u.includes("✓"))       return "text-emerald-400 font-medium";
  if (u.includes("[ERROR]") || u.includes("[FAILURE]") || u.includes("✗")) return "text-red-400";
  if (u.includes("[EVOLUTION]") || u.includes("⚡"))     return "text-primary";
  if (u.includes("[SKILL]"))          return "text-cyan-400";
  if (u.includes("[TASK]"))           return "text-yellow-400";
  if (u.includes("[SYSTEM]"))         return "text-white/30";
  if (u.includes("[WARNING]"))        return "text-amber-400";
  return "text-white/50";
}

const FILTERS = ["All", "Planning", "Research", "Reasoning", "Builder", "Evolution", "System"] as const;
type Filter = (typeof FILTERS)[number];

function matchesFilter(line: string, filter: Filter): boolean {
  if (filter === "All") return true;
  const u = line.toUpperCase();
  const map: Record<Filter, string> = {
    All:      "",
    Planning: "[PLANNING]",
    Research: "[RESEARCH]",
    Reasoning: "[REASONING]",
    Builder:  "[BUILDER]",
    Evolution: "[EVOLUTION]",
    System:   "[SYSTEM]",
  };
  return u.includes(map[filter]);
}

interface AgentLogStreamProps {
  /** If provided, only show logs matching this task ID prefix */
  taskId?: string;
  className?: string;
  showFilters?: boolean;
  showClear?: boolean;
  maxLines?: number;
}

export function AgentLogStream({
  taskId,
  className = "",
  showFilters = true,
  showClear = false,
  maxLines = 200,
}: AgentLogStreamProps) {
  const { logs, clearLogs } = useAppStore();
  const [filter, setFilter] = useState<Filter>("All");
  const [paused, setPaused] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Apply filters
  let display = logs.slice(-maxLines);
  if (taskId) {
    display = display.filter((l) => l.includes(taskId.slice(0, 8)));
  }
  display = display.filter((l) => matchesFilter(l, filter));

  // Auto-scroll
  useEffect(() => {
    if (!paused && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [display, paused]);

  return (
    <div className={`flex flex-col h-full overflow-hidden ${className}`}>
      {/* Controls */}
      <div className="shrink-0 flex items-center justify-between px-3 py-2 border-b border-white/[0.04] bg-black/10">
        <div className="flex items-center gap-1.5 flex-wrap">
          {showFilters && FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-[9px] uppercase tracking-[0.1em] font-semibold px-2 py-1 rounded-md transition-colors ${
                filter === f
                  ? "bg-white/[0.08] text-white/90"
                  : "text-white/25 hover:text-white/60 hover:bg-white/[0.04]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[9px] font-mono text-white/20">{display.length} events</span>
          <button
            onClick={() => setPaused((p) => !p)}
            className="text-white/25 hover:text-white/60 transition-colors p-1 rounded"
            title={paused ? "Resume scroll" : "Pause scroll"}
          >
            {paused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
          </button>
          {showClear && (
            <button
              onClick={clearLogs}
              className="text-white/20 hover:text-red-400/70 transition-colors p-1 rounded"
              title="Clear logs"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
          {!paused && (
            <ChevronDown className="w-3 h-3 text-white/20 animate-bounce" />
          )}
        </div>
      </div>

      {/* Log Output */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 font-mono text-[11px] leading-relaxed space-y-0.5 scroll-smooth"
      >
        <AnimatePresence initial={false}>
          {display.length === 0 ? (
            <div className="text-center py-8 text-white/15 text-xs">
              No {filter !== "All" ? `[${filter}] ` : ""}events yet…
            </div>
          ) : (
            display.map((line, i) => (
              <motion.div
                key={`${i}-${line.slice(0, 20)}`}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.1 }}
                className={`px-1.5 py-0.5 rounded hover:bg-white/[0.02] cursor-default select-text whitespace-pre-wrap break-all ${getLogStyle(line)}`}
              >
                {line}
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
