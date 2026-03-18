"use client";

import { useEffect, useRef, useCallback } from "react";
import { useAppStore } from "@/store/app-store";
import type { WsEvent, Task } from "@/types";

const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL || "ws://127.0.0.1:8000/ws/events";

// ─────────────────────────────────────────────────────────────
// useAxonWebSocket
// Connects to the backend event bus, routes all events to
// the correct store updaters, and handles auto-reconnect.
// ─────────────────────────────────────────────────────────────
export function useAxonWebSocket() {
  const {
    addLog,
    setEvolutionActive,
    setEvolutionState,
    addTask,
    updateTask,
    updateTaskStatus,
    addSkill,
    setSystemStatus,
    setVersion,
    addNotification,
    addEvolutionEntry,
  } = useAppStore();

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttempts = useRef(0);

  const connect = useCallback(() => {
    if (
      wsRef.current?.readyState === WebSocket.OPEN ||
      wsRef.current?.readyState === WebSocket.CONNECTING
    )
      return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      reconnectAttempts.current = 0;
      setSystemStatus("Live");
      addLog(`[SYSTEM] ✓ Connected to AXON event bus`);
    };

    ws.onmessage = (event) => {
      try {
        // Try plain text first
        if (typeof event.data === "string" && !event.data.startsWith("{")) {
          addLog(event.data);
          return;
        }

        const data: WsEvent = JSON.parse(event.data);
        handleEvent(data);
      } catch {
        addLog(`[RAW] ${event.data}`);
      }
    };

    ws.onclose = () => {
      setSystemStatus("Idle");
      const delay = Math.min(30000, Math.pow(2, reconnectAttempts.current) * 1000);
      reconnectAttempts.current += 1;
      addLog(`[SYSTEM] Connection closed. Reconnecting in ${Math.round(delay / 1000)}s...`);
      reconnectTimer.current = setTimeout(connect, delay);
    };

    ws.onerror = () => {
      ws.close();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Central event router
  const handleEvent = useCallback(
    (data: WsEvent) => {
      const { type, payload } = data;
      const p = payload as Record<string, unknown>;

      switch (type) {
        // ── Task Events ──────────────────────────────────────
        case "task.created": {
          const task: Task = {
            id: String(p?.id ?? Math.random().toString(36).slice(2)),
            title: String(p?.title ?? "New Task"),
            description: p?.description ? String(p?.description) : undefined,
            status: "queued",
            created_at: String(p?.created_at ?? new Date().toISOString()),
            name: String(p?.title ?? "New Task"),
            version: "v0",
            time: "0s",
          };
          addTask(task);
          addLog(`[TASK] Created: "${task.title}"`);
          addNotification(`Task created: "${task.title}"`, "info");
          break;
        }

        case "task.updated": {
          const id = String(p?.id ?? p?.task_id ?? "");
          if (id) updateTask(id, { status: p?.status as Task["status"] });
          addLog(`[TASK] Updated: ${id}`);
          break;
        }

        case "task.completed": {
          const id = String(p?.id ?? p?.task_id ?? "");
          if (id) updateTaskStatus(id, "completed");
          addLog(`[SUCCESS] Task completed — result ready`);
          addNotification("Task completed successfully", "success");
          break;
        }

        case "task.failed": {
          const id = String(p?.id ?? p?.task_id ?? "");
          if (id) updateTaskStatus(id, "failed");
          const reason = p?.error ?? p?.reason ?? "Unknown error";
          addLog(`[FAILURE] Task failed: ${reason}`);
          addNotification(`Task failed: ${reason}`, "error");
          break;
        }

        case "task.retried": {
          const id = String(p?.id ?? p?.task_id ?? "");
          if (id) updateTaskStatus(id, "running");
          addLog(`[TASK] Retrying task after skill generation...`);
          break;
        }

        // ── Agent Events ──────────────────────────────────────
        case "agent.step": {
          const agent = String(p?.agent ?? "AGENT").toUpperCase();
          const msg = String(p?.message ?? JSON.stringify(p));
          addLog(`[${agent}] ${msg}`);
          break;
        }

        case "pipeline.completed": {
          addLog(`[PIPELINE] All agents finished.`);
          break;
        }

        // ── Evolution Events ──────────────────────────────────
        case "evolution.triggered":
        case "evolution.started": {
          setEvolutionActive(true);
          setEvolutionState({
            status: "running",
            generated_skills: 0,
            failed_tasks: 0,
          });
          addLog(`[EVOLUTION] ⚡ Evolution engine activated — researching missing capability...`);
          addNotification("Evolution cycle started", "info");
          break;
        }

        case "evolution.completed": {
          const newSkill = p?.skill_name ? String(p.skill_name) : undefined;
          const newVersion = p?.version ? String(p.version) : undefined;

          if (newSkill) addSkill(newSkill);
          if (newVersion) setVersion(newVersion);

          setEvolutionState({
            status: "completed",
            generated_skills: Number(p?.skills_generated ?? 1),
            failed_tasks: Number(p?.failed_tasks ?? 0),
            last_run: new Date().toISOString(),
            current_version: newVersion,
          });

          addEvolutionEntry({
            version: newVersion ?? "v1",
            timestamp: new Date().toISOString(),
            skills_added: newSkill ? [newSkill] : [],
          });

          addLog(`[EVOLUTION] ✓ Evolution complete${newVersion ? ` → ${newVersion}` : ""}${newSkill ? ` (+${newSkill})` : ""}`);
          addNotification(`Evolution complete! New skill: ${newSkill ?? "unknown"}`, "success");
          break;
        }

        case "evolution.failed": {
          setEvolutionState({
            status: "failed",
            generated_skills: 0,
            failed_tasks: 1,
          });
          addLog(`[EVOLUTION] ✗ Evolution failed: ${p?.error ?? "unknown error"}`);
          addNotification("Evolution cycle failed", "error");
          break;
        }

        // ── Skill Events ──────────────────────────────────────
        case "skill.generated":
        case "skill.created":
        case "skill.registered": {
          const skillName = p?.skill ?? p?.name ?? p?.skill_name;
          if (skillName) {
            addSkill(String(skillName));
            addLog(`[SKILL] New capability registered: ${skillName}`);
            addNotification(`New skill available: ${skillName}`, "success");
          }
          break;
        }

        // ── System Events ─────────────────────────────────────
        case "system.updated": {
          addLog(`[SYSTEM] Configuration updated`);
          break;
        }

        default: {
          addLog(`[EVENT:${type}] ${JSON.stringify(p ?? {})}`);
        }
      }
    },
    [
      addLog,
      addNotification,
      addTask,
      updateTask,
      updateTaskStatus,
      addSkill,
      setEvolutionActive,
      setEvolutionState,
      setVersion,
      addEvolutionEntry,
    ]
  );

  useEffect(() => {
    connect();

    return () => {
      wsRef.current?.close();
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };
  }, [connect]);
}
