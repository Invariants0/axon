"use client";

import { useAppStore } from "@/store/app-store";
import { useMockWebSocket } from "@/hooks/use-mock-websocket";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Play,
  Square,
  Terminal,
  Network,
  Code2,
  Activity,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Clock,
  UserCog,
  Plus,
  Sparkles,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Input } from "@/components/ui/input";

export default function DashboardPage() {
  const {
    isEvolutionActive,
    setEvolutionActive,
    logs,
    skills,
    version,
    tasks,
    addTask,
    isAutoTaskEnabled,
    setIsAutoTaskEnabled,
    plannedSkills,
    installSkill,
    persona,
    setPersona,
  } = useAppStore();

  const [taskInput, setTaskInput] = useState("");
  const [isAddingPersona, setIsAddingPersona] = useState(false);
  const [newPersonaName, setNewPersonaName] = useState("");
  const [newPersonaPrompt, setNewPersonaPrompt] = useState("");
  const [customPersonas, setCustomPersonas] = useState<
    { name: string; prompt: string }[]
  >([]);
  const [isPersonaMenuOpen, setIsPersonaMenuOpen] = useState(false);

  useMockWebSocket();

  const handleRunTask = () => {
    if (!taskInput.trim()) return;
    addTask({
      id: Math.random().toString(36).substring(7),
      name: taskInput,
      status: "pending",
      version,
      time: "0s",
    });
    setTaskInput("");
    if (!isEvolutionActive) setEvolutionActive(true);
  };

  const handleCreatePersona = () => {
    if (!newPersonaName.trim() || !newPersonaPrompt.trim()) return;
    const newPersona = { name: newPersonaName, prompt: newPersonaPrompt };
    setCustomPersonas([...customPersonas, newPersona]);
    setPersona(newPersona.name as any);
    setIsAddingPersona(false);
    setNewPersonaName("");
    setNewPersonaPrompt("");
    setIsPersonaMenuOpen(false);
  };

  // Modern glassmorphic button class
  const glassButtonClass =
    "relative overflow-hidden bg-gradient-to-b from-white/10 to-white/5 hover:from-white/20 hover:to-white/10 text-white border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.1)] backdrop-blur-md rounded-md transition-all duration-300";

  return (
    <div className="h-full flex flex-col p-6 gap-6 overflow-hidden">
      {/* Persona Header Section */}
      <div className="flex items-center justify-between bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/5 p-4 rounded-xl shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20">
            <UserCog className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-tight">
              Active Persona
            </h2>
            <p className="text-xs text-muted-foreground">{persona}</p>
          </div>
        </div>

        <div className="relative">
          <Button
            variant="outline"
            className={glassButtonClass}
            onClick={() => setIsPersonaMenuOpen(!isPersonaMenuOpen)}
          >
            Change Persona
          </Button>

          <AnimatePresence>
            {isPersonaMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute right-0 top-12 w-80 bg-[#121212]/95 border border-white/10 rounded-xl shadow-2xl backdrop-blur-2xl z-50 overflow-hidden"
              >
                <div className="p-2 space-y-1">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2 py-1">
                    Presets
                  </div>
                  {["Engineer", "Researcher", "Hacker", "Minimal Agent"].map(
                    (p) => (
                      <button
                        key={p}
                        onClick={() => {
                          setPersona(p as any);
                          setIsPersonaMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${persona === p ? "bg-white/10 text-white" : "hover:bg-white/5 text-foreground"}`}
                      >
                        {p}
                      </button>
                    ),
                  )}

                  {customPersonas.length > 0 && (
                    <>
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2 py-1 mt-2">
                        Custom
                      </div>
                      {customPersonas.map((p) => (
                        <button
                          key={p.name}
                          onClick={() => {
                            setPersona(p.name as any);
                            setIsPersonaMenuOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${persona === p.name ? "bg-white/10 text-white" : "hover:bg-white/5 text-foreground"}`}
                        >
                          {p.name}
                        </button>
                      ))}
                    </>
                  )}

                  <div className="h-px bg-white/10 my-2" />
                  <button
                    onClick={() => {
                      setIsAddingPersona(true);
                      setIsPersonaMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-white/10 rounded-md transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Create New Persona
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Custom Persona Modal */}
      <AnimatePresence>
        {isAddingPersona && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#121212] border border-white/10 rounded-xl p-6 w-full max-w-md shadow-2xl relative"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">
                  Create Custom Persona
                </h3>
                <button
                  onClick={() => setIsAddingPersona(false)}
                  className="text-muted-foreground hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/80">
                    Name
                  </label>
                  <Input
                    placeholder="e.g., QA Expert"
                    value={newPersonaName}
                    onChange={(e) => setNewPersonaName(e.target.value)}
                    className="bg-black/50 border-white/10 text-white focus-visible:ring-1 focus-visible:ring-white/20 focus-visible:ring-offset-0"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/80">
                    System Prompt
                  </label>
                  <textarea
                    placeholder="System instructions / Prompt..."
                    value={newPersonaPrompt}
                    onChange={(e) => setNewPersonaPrompt(e.target.value)}
                    className="w-full min-h-[120px] rounded-md border border-white/10 bg-black/50 px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
                <Button
                  onClick={handleCreatePersona}
                  className={`w-full ${glassButtonClass} mt-6`}
                >
                  Save Persona
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Grid: Task Input, Logs, Skills */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        {/* Left: Task Input */}
        <Card className="lg:col-span-3 border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl flex flex-col relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
          <CardHeader className="py-4 px-5 border-b border-white/5 bg-white/5 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Task Control
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">
                Auto
              </span>
              <button
                onClick={() => setIsAutoTaskEnabled(!isAutoTaskEnabled)}
                className={`w-8 h-4 rounded-full transition-colors relative ${isAutoTaskEnabled ? "bg-primary" : "bg-white/10"}`}
              >
                <div
                  className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${isAutoTaskEnabled ? "left-4.5" : "left-0.5"}`}
                />
              </button>
            </div>
          </CardHeader>
          <CardContent className="p-5 flex flex-col gap-4 overflow-hidden">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {isAutoTaskEnabled
                  ? "Autonomous Tasking Active"
                  : "Manual Assignment"}
              </label>
              <Input
                placeholder={
                  isAutoTaskEnabled
                    ? "System finding tasks..."
                    : "e.g., Find latest AI news"
                }
                value={taskInput}
                disabled={isAutoTaskEnabled}
                onChange={(e) => setTaskInput(e.target.value)}
                className="bg-black/50 border-white/10 focus-visible:ring-primary"
                onKeyDown={(e) => e.key === "Enter" && handleRunTask()}
              />
            </div>
            <Button
              onClick={handleRunTask}
              disabled={isAutoTaskEnabled || !taskInput.trim()}
              className={`w-full text-foreground hover:text-white transition-all shadow-[0_8px_32px_0_rgba(255,255,255,0.05)] backdrop-blur-md rounded-md bg-gradient-to-br from-white/10 via-white/5 to-white/10 hover:from-white/20 hover:via-white/10 hover:to-white/20 border border-white/10`}
            >
              Run Task <ArrowRight className="w-4 h-4 ml-2" />
            </Button>

            <div className="mt-6 space-y-2 flex-1 overflow-y-auto pr-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Recent Tasks
              </label>
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="p-3 rounded-lg border border-white/5 bg-white/5 flex items-center justify-between"
                >
                  <span className="text-sm truncate pr-2">{task.name}</span>
                  {task.status === "success" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : task.status === "fail" ? (
                    <XCircle className="w-4 h-4 text-destructive shrink-0" />
                  ) : (
                    <Clock className="w-4 h-4 text-yellow-500 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Center: Live Agent Logs */}
        <Card className="lg:col-span-6 border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl flex flex-col">
          <CardHeader className="py-4 px-5 border-b border-white/5 bg-white/5 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Terminal className="w-4 h-4 text-primary" />
              Live Agent Logs
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-muted-foreground">
                ws://axon.core/stream
              </span>
              <Button
                variant="outline"
                size="sm"
                className={`h-7 px-3 text-xs shadow-[0_4px_30px_0_rgba(255,255,255,0.05)] backdrop-blur-md rounded-md bg-gradient-to-br from-white/10 via-white/5 to-white/10 hover:from-white/20 hover:via-white/10 hover:to-white/20 border border-white/10 text-foreground transition-all duration-300 ${isEvolutionActive ? "text-destructive hover:text-red-400" : ""}`}
                onClick={() => setEvolutionActive(!isEvolutionActive)}
              >
                {isEvolutionActive ? (
                  <>
                    <Square className="w-3 h-3 mr-1" /> Halt
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 mr-1" /> Start
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 relative bg-black/50">
            <ScrollArea className="h-full w-full p-4">
              <div className="space-y-2 font-mono text-sm">
                <AnimatePresence initial={false}>
                  {logs.map((log, i) => {
                    let colorClass = "text-muted-foreground";
                    if (log.includes("[REASONING]"))
                      colorClass = "text-blue-400";
                    if (log.includes("[EXECUTION]")) colorClass = "text-white";
                    if (log.includes("[WARNING]"))
                      colorClass = "text-yellow-500";
                    if (log.includes("[FAILURE]"))
                      colorClass = "text-destructive";
                    if (
                      log.includes("[EVOLUTION]") ||
                      log.includes("[RESEARCH]") ||
                      log.includes("[BUILD]")
                    )
                      colorClass = "text-primary";
                    if (log.includes("[SUCCESS]"))
                      colorClass = "text-emerald-500";

                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`p-2 rounded border border-white/5 bg-white/5 ${colorClass}`}
                      >
                        {log}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                {logs.length === 0 && (
                  <div className="text-muted-foreground/50 italic text-center py-10">
                    Awaiting task input...
                  </div>
                )}
              </div>
            </ScrollArea>
            <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-black/80 to-transparent pointer-events-none"></div>
          </CardContent>
        </Card>

        {/* Right: Skills Panel & Capability Graph */}
        <div className="lg:col-span-3 flex flex-col gap-6 overflow-hidden min-h-0">
          <Card className="flex-1 flex flex-col border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-white/[0.02] to-transparent pointer-events-none" />
            <CardHeader className="py-4 px-5 border-b border-white/5 bg-white/5">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Code2 className="w-4 h-4 text-primary" />
                Skill Architecture
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 flex-1 overflow-y-auto space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Installed
                </label>
                <div className="space-y-2">
                  <AnimatePresence>
                    {skills.map((skill) => (
                      <motion.div
                        key={skill}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-3 rounded-lg border border-white/5 bg-white/5 flex items-center justify-between shadow-[0_4px_12px_rgba(255,255,255,0.02)] backdrop-blur-sm"
                      >
                        <span className="font-mono text-xs">{skill}</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Planned / Available
                </label>
                <div className="space-y-2">
                  <AnimatePresence>
                    {plannedSkills.map((skill) => (
                      <motion.div
                        key={skill}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="p-3 rounded-lg border border-white/5 bg-white/5 flex items-center justify-between shadow-[0_4px_12px_rgba(255,255,255,0.02)] backdrop-blur-sm"
                      >
                        <span className="font-mono text-xs text-muted-foreground">
                          {skill}
                        </span>
                        <Button
                          onClick={() => installSkill(skill)}
                          size="sm"
                          className="h-6 px-3 text-[10px] shadow-[0_4px_30px_0_rgba(255,255,255,0.05)] backdrop-blur-md rounded-md bg-gradient-to-br from-white/10 via-white/5 to-white/10 hover:from-white/20 hover:via-white/10 hover:to-white/20 border border-white/10 text-foreground transition-all duration-300"
                        >
                          Install
                        </Button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {plannedSkills.length === 0 && (
                    <div className="text-[10px] text-center italic text-muted-foreground py-4">
                      All planned skills installed.
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Capability Graph Section */}
          <Card className="h-48 shrink-0 flex flex-col border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            <CardHeader className="py-3 px-5 border-b border-white/5 bg-white/5">
              <CardTitle className="text-xs font-semibold flex items-center gap-2 tracking-tight text-white/90">
                <Network className="w-3.5 h-3.5 text-primary" />
                Capability Graph
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-4 relative overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:12px_12px] opacity-30" />

              <div className="relative w-full h-full flex items-center justify-center">
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute z-20 w-8 h-8 rounded-full border border-primary/50 bg-primary/20 flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.1)] backdrop-blur-md"
                >
                  <Network className="w-4 h-4 text-white" />
                </motion.div>

                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1,
                  }}
                  className="absolute top-[20%] left-[20%] w-4 h-4 rounded-full border border-white/30 bg-white/10 z-10"
                />

                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.5,
                  }}
                  className="absolute bottom-[20%] left-[30%] w-3 h-3 rounded-full border border-white/30 bg-white/10 z-10"
                />

                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{
                    duration: 3.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 2,
                  }}
                  className="absolute top-[30%] right-[20%] w-4 h-4 rounded-full border border-white/30 bg-white/10 z-10"
                />

                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                  <motion.line
                    x1="50%"
                    y1="50%"
                    x2="25%"
                    y2="25%"
                    stroke="rgba(255,255,255,0.15)"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatType: "reverse",
                    }}
                  />
                  <line
                    x1="50%"
                    y1="50%"
                    x2="33%"
                    y2="76%"
                    stroke="rgba(255,255,255,0.15)"
                    strokeWidth="1"
                  />
                  <line
                    x1="50%"
                    y1="50%"
                    x2="76%"
                    y2="33%"
                    stroke="rgba(255,255,255,0.15)"
                    strokeWidth="1"
                  />
                </svg>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Section: Evolution Timeline */}
      <Card className="h-48 shrink-0 border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl flex flex-col">
        <CardHeader className="py-3 px-5 border-b border-white/5 bg-white/5">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Network className="w-4 h-4 text-primary" />
            Evolution Timeline
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 flex items-center gap-4 overflow-x-auto">
          <div className="flex items-center gap-4 min-w-max">
            <div className="flex flex-col gap-2">
              <div className="text-xs text-muted-foreground">10:00 AM</div>
              <div className="p-3 rounded-lg border border-white/5 bg-white/5 w-48">
                <div className="font-bold text-sm mb-1 text-foreground">
                  AXON v0
                </div>
                <div className="text-xs text-muted-foreground">
                  Initial deployment
                </div>
              </div>
            </div>
            <div className="w-8 h-[1px] bg-white/20"></div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col gap-2"
            >
              <div className="text-xs text-primary">10:05 AM</div>
              <div className="p-3 rounded-lg border border-primary/30 bg-primary/10 w-48 shadow-[0_0_20px_rgba(168,85,247,0.1)]">
                <div className="font-bold text-sm text-primary mb-1">
                  AXON v1
                </div>
                <div className="text-xs text-muted-foreground">
                  + added{" "}
                  <span className="font-mono text-primary">web_search</span>
                </div>
              </div>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
