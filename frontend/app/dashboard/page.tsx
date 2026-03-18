"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/app-store";
import { useAxonWebSocket } from "@/hooks/use-axon-websocket";
import { AxonChat } from "@/components/ui/axon-chat";
import { LiveAgentTerminal } from "@/components/ui/live-agent-terminal";
import { CapabilityGraph } from "@/components/ui/capability-graph";
import { EvolutionTimeline } from "@/components/ui/evolution-timeline";
import { EvolutionControlPanel } from "@/components/ui/evolution-control-panel";
import { SystemStatusPanel } from "@/components/ui/system-status-panel";
import { tasksApi } from "@/lib/api-client";
import { motion } from "framer-motion";
import { Network } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  const { addTask, tasks } = useAppStore();

  // Boot the WebSocket (single mount in root page)
  useAxonWebSocket();

  // Hydrate task list from backend on first load
  useEffect(() => {
    tasksApi.list(30).then((data) => {
      if (!Array.isArray(data)) return;
      data.forEach((task) => {
        if (!tasks.find((t) => t.id === task.id)) {
          addTask({
            ...task,
            name: task.title,
            version: "v0",
            time: task.created_at
              ? new Date(task.created_at).toLocaleTimeString()
              : "",
          });
        }
      });
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="h-full flex flex-col p-4 lg:p-6 gap-4 overflow-hidden">
      {/* ── Top Row: Chat + Terminal ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">
        {/* Left: Control Room Chat */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="lg:col-span-4 flex flex-col min-h-0"
        >
          <AxonChat />
        </motion.div>

        {/* Center: Live Agent Terminal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="lg:col-span-5 flex flex-col min-h-0"
        >
          <LiveAgentTerminal />
        </motion.div>

        {/* Right Column: Evolution + Status */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="lg:col-span-3 flex flex-col gap-4 min-h-0 overflow-visible"
        >
          <EvolutionControlPanel />
          <SystemStatusPanel />

          {/* Capability Graph */}
          <Card className="flex-1 min-h-[180px] border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl overflow-hidden">
            <CardHeader className="py-3 px-5 border-b border-white/5 bg-white/5">
              <CardTitle className="text-xs font-semibold flex items-center gap-2 text-white/90">
                <Network className="w-3.5 h-3.5 text-primary" />
                Capability Graph
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 h-full min-h-[180px] relative">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:12px_12px] opacity-50" />
              <CapabilityGraph />
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ── Bottom: Evolution Timeline ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
        className="shrink-0"
      >
        <EvolutionTimeline />
      </motion.div>
    </div>
  );
}
