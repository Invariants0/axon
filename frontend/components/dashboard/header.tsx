"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  BrainCircuit,
  ChevronDown,
  Sparkles,
  Radio,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppStore } from "@/store/app-store";
import type { PersonaMode } from "@/types";

const PERSONAS: PersonaMode[] = [
  "Engineer",
  "Research Scientist",
  "Startup Hacker",
  "Minimal Agent",
];

const AGENTS = [
  { name: "Reasoning Agent", status: "Optimal", load: 12 },
  { name: "Planning Agent", status: "Ready", load: 5 },
  { name: "Execution Agent", status: "Idle", load: 2 },
  { name: "Evolution Agent", status: "Standby", load: 0 },
];

export function DashboardHeader() {
  const { version, systemStatus, activeAgents, persona, setPersona } =
    useAppStore();

  const statusColor =
    systemStatus === "Live"
      ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]"
      : systemStatus === "Evolving"
      ? "bg-primary animate-pulse shadow-[0_0_6px_rgba(168,85,247,0.6)]"
      : "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.6)]";

  return (
    <header className="h-14 border-b border-white/[0.06] bg-black/50 backdrop-blur-xl flex items-center justify-between px-5 z-50 shrink-0">
      {/* Left: Logo + Version */}
      <div className="flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20 group-hover:border-primary/40 transition-colors">
            <BrainCircuit className="w-[18px] h-[18px] text-primary" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight text-white">
            AXON
          </span>
        </Link>

        <div className="h-5 w-px bg-white/[0.08]" />

        {/* Version Badge */}
        <AnimatePresence mode="wait">
          <motion.div
            key={version}
            initial={{ opacity: 0, scale: 0.9, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 4 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/[0.08] border border-primary/15"
          >
            <Sparkles className="w-3 h-3 text-primary" />
            <span className="text-xs font-mono font-semibold text-primary tracking-wide">
              {version}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Right: Status indicators + Persona */}
      <div className="flex items-center gap-4">
        {/* Agent count */}
        <DropdownMenu>
          <DropdownMenuTrigger className="hidden md:flex items-center gap-2 text-xs font-medium text-white/50 hover:text-white/80 transition-colors outline-none cursor-pointer">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500/80 shadow-[0_0_4px_rgba(59,130,246,0.5)]" />
            <span>
              Agents: <span className="text-white/90 font-semibold">{activeAgents}</span>
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="center"
            className="bg-[#080808] border-white/[0.08] w-60 p-2 backdrop-blur-xl"
          >
            <div className="text-[9px] uppercase tracking-[0.15em] font-bold text-white/25 px-2 py-1.5 mb-1">
              Active Neural Nodes
            </div>
            {AGENTS.map((agent) => (
              <div
                key={agent.name}
                className="p-2 rounded-lg hover:bg-white/[0.04] flex flex-col gap-1.5 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-white/80">
                    {agent.name}
                  </span>
                  <span className="text-[9px] text-emerald-500/80 font-mono">
                    {agent.status}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-[3px] bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500/60 rounded-full transition-all"
                      style={{ width: `${agent.load}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-white/25 font-mono w-6 text-right">
                    {agent.load}%
                  </span>
                </div>
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* System Status */}
        <div className="hidden md:flex items-center gap-2 text-xs font-medium text-white/50">
          <span className={`w-1.5 h-1.5 rounded-full ${statusColor}`} />
          <span>
            <span className="text-white/90">{systemStatus}</span>
          </span>
        </div>

        <div className="h-5 w-px bg-white/[0.06] hidden md:block" />

        {/* Persona Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-xs font-medium transition-all border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] h-8 px-3 outline-none text-white/70 hover:text-white/90">
            <Radio className="w-3 h-3 text-primary/70" />
            {persona}
            <ChevronDown className="w-3 h-3 text-white/30" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="bg-[#080808] border-white/[0.08] backdrop-blur-xl"
          >
            {PERSONAS.map((p) => (
              <DropdownMenuItem
                key={p}
                onClick={() => setPersona(p)}
                className={`hover:bg-white/[0.04] focus:bg-white/[0.04] cursor-pointer text-xs ${
                  persona === p ? "text-primary font-semibold" : ""
                }`}
              >
                {p}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
