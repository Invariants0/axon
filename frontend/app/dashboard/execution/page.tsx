"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Activity,
  Terminal,
  Play,
  Square,
  GitCommit,
  GitPullRequest,
  Search,
  CheckCircle,
  Clock,
} from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";

const dummyTasks = [
  {
    id: "TSK-1234",
    title: "Implement user auth API",
    status: "completed",
    logs: [
      "[EXECUTION] Generating JWT utility.",
      "[REASONING] Using HS256 algorithm.",
      "[SUCCESS] Auth API generated.",
    ],
  },
  {
    id: "TSK-1235",
    title: "Refactor dashboard layout",
    status: "in-progress",
    logs: [
      "[EXECUTION] Updating grid constraints.",
      "[WARNING] Potential overflow detected...",
      "[EVOLUTION] Attempting autonomous fix.",
    ],
  },
  {
    id: "TSK-1236",
    title: "Optimize database queries",
    status: "pending",
    logs: [],
  },
];

export default function ExecutionPage() {
  const { isEvolutionActive, setEvolutionActive, logs } = useAppStore();
  const [selectedTask, setSelectedTask] = useState<
    (typeof dummyTasks)[0] | null
  >(dummyTasks[0]);
  const [autoVerify, setAutoVerify] = useState(false);
  const router = useRouter();

  return (
    <div className="h-full p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Task List */}
      <Card className="h-full flex flex-col border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl col-span-1">
        <CardHeader className="py-4 px-5 border-b border-white/5 bg-white/5 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Task Execution Group
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 flex-1 relative">
          <ScrollArea className="h-[calc(100vh-12rem)]">
            <div className="p-4 space-y-3">
              {dummyTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className={`p-4 rounded-xl border border-white/5 cursor-pointer transition-all duration-300 group ${selectedTask?.id === task.id ? "bg-white/10 shadow-lg shadow-white/5" : "bg-white/5 hover:bg-white/10"} backdrop-blur-md`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-mono text-muted-foreground">
                      {task.id}
                    </span>
                    {task.status === "completed" && (
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    )}
                    {task.status === "in-progress" && (
                      <Activity className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
                    )}
                    {task.status === "pending" && (
                      <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                  </div>
                  <h3 className="text-sm font-medium text-white group-hover:text-primary transition-colors">
                    {task.title}
                  </h3>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Task Details & Logs */}
      <Card className="h-full flex flex-col border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl col-span-1 lg:col-span-2">
        <CardHeader className="py-4 px-5 border-b border-white/5 bg-white/5 flex flex-row items-center justify-between flex-wrap gap-4">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Terminal className="w-4 h-4 text-primary" />
            {selectedTask ? selectedTask.id + " Logs" : "Execution Logs"}
          </CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="auto-verify"
                checked={autoVerify}
                onCheckedChange={setAutoVerify}
              />
              <Label
                htmlFor="auto-verify"
                className="text-xs text-muted-foreground"
              >
                Auto-Verify
              </Label>
            </div>

            {selectedTask && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-4 text-xs border-white/10 bg-white/5 hover:bg-white/10 transition-colors shadow-sm"
                onClick={() => router.push("/dashboard/evolution")}
              >
                <GitPullRequest className="w-3.5 h-3.5 mr-2" />
                Review & Verify Evolution
              </Button>
            )}

            <Button
              variant={isEvolutionActive ? "destructive" : "outline"}
              size="sm"
              className="h-8 px-4 text-xs border-white/10 bg-white/5 hover:bg-white/10"
              onClick={() => setEvolutionActive(!isEvolutionActive)}
            >
              {isEvolutionActive ? (
                <>
                  <Square className="w-3.5 h-3.5 mr-2" /> Stop Agent
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 mr-2" /> Resume Agent
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-0 relative bg-black/50">
          <ScrollArea className="absolute inset-0 p-4">
            <div className="space-y-3 font-mono text-sm max-w-full">
              {selectedTask ? (
                <AnimatePresence initial={false}>
                  {selectedTask.logs.length > 0 ? (
                    selectedTask.logs.map((log, i) => {
                      let colorClass = "text-muted-foreground";
                      if (log.includes("[REASONING]"))
                        colorClass = "text-blue-400";
                      if (log.includes("[EXECUTION]"))
                        colorClass = "text-white";
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
                          className={`p-3 rounded-lg border border-white/5 bg-white/5 backdrop-blur-md ${colorClass} text-xs`}
                        >
                          {log}
                        </motion.div>
                      );
                    })
                  ) : (
                    <div className="text-muted-foreground/50 italic text-center py-10">
                      No logs generated for this task yet.
                    </div>
                  )}
                </AnimatePresence>
              ) : (
                <div className="text-muted-foreground/50 text-center py-20 flex flex-col items-center gap-4">
                  <Search className="w-8 h-8 opacity-20" />
                  <p>
                    Select a task from the list to view its execution details.
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
