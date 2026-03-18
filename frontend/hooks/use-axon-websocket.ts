"use client";

// ============================================================
// hooks/use-axon-websocket.ts
// WebSocket event bus — aligned with AXON data contract §3.2
//
// Contract event format:
//   { "event": "task.created", "trace_id": "...", "task_id": "...",
//     "timestamp": "...", "data": { ... } }
//
// Connection confirm:
//   { "event": "connected", "message": "AXON event stream connected" }
// ============================================================

import { useEffect, useRef, useCallback } from "react";
import { useAppStore } from "@/store/app-store";
import type { WsEvent, Task } from "@/types";
import { WS_URL } from "@/lib/constants";

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

  const wsRef            = useRef<WebSocket | null>(null);
  const reconnectTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttempts = useRef(0);

  // ─── Event Router (per data contract event catalog) ────────
  const handleEvent = useCallback(
    (ev: WsEvent) => {
      const type = ev.event;
      const d    = ev.data ?? {};
      const tid  = ev.task_id ?? String(d.task_id ?? "");

      switch (type) {
        // ── Connection ─────────────────────────────────────────
        case "connected": {
          addLog(`[SYSTEM] ✓ AXON event stream connected`);
          break;
        }

        // ── Task Events ────────────────────────────────────────
        case "task.created": {
          const task: Task = {
            id:           tid || String(d.task_id ?? Math.random().toString(36).slice(2)),
            chat_id:      d.chat_id ? String(d.chat_id) : null,
            title:        String(d.title ?? "New Task"),
            description:  String(d.description ?? ""),
            status:       "queued",
            result:       "",
            created_at:   ev.timestamp ?? new Date().toISOString(),
            updated_at:   ev.timestamp ?? new Date().toISOString(),
            trace_id:     ev.trace_id,
          };
          addTask(task);
          addLog(`[TASK] Created: "${task.title}"`);
          addNotification(`Task created: "${task.title}"`, "info");
          break;
        }

        case "task.started": {
          if (tid) updateTaskStatus(tid, "running");
          addLog(`[TASK] Started: ${tid}`);
          break;
        }

        case "task.completed": {
          if (tid) updateTaskStatus(tid, "completed");
          if (d.result) updateTask(tid, { result: String(d.result), status: "completed" });
          addLog(`[SUCCESS] Task completed — result ready`);
          addNotification("Task completed successfully", "success");
          break;
        }

        case "task.failed": {
          if (tid) updateTaskStatus(tid, "failed");
          const error = d.error ?? d.reason ?? "Unknown error";
          addLog(`[FAILURE] Task failed: ${error}`);
          addNotification(`Task failed: ${error}`, "error");
          break;
        }

        // Legacy
        case "task.updated":
        case "task.retried": {
          if (tid && d.status) updateTask(tid, { status: d.status as Task["status"] });
          break;
        }

        // ── Pipeline Events ─────────────────────────────────────
        case "pipeline.started": {
          addLog(`[PIPELINE] Pipeline started for task ${tid}`);
          break;
        }

        case "pipeline.completed": {
          const dur = d.total_duration_ms ? `${d.total_duration_ms}ms` : "";
          addLog(`[PIPELINE] All agents finished${dur ? ` in ${dur}` : ""}.`);
          break;
        }

        // ── Agent Events ─────────────────────────────────────────
        case "agent.started": {
          const agentName = String(d.agent_name ?? "?").toUpperCase();
          addLog(`[${agentName}] Agent started`);
          break;
        }

        case "agent.completed": {
          const agentName = String(d.agent_name ?? "?").toUpperCase();
          const dur = d.duration_ms ? ` (${d.duration_ms}ms)` : "";
          addLog(`[${agentName}] Completed${dur}`);
          break;
        }

        case "agent.error": {
          const agentName = String(d.agent_name ?? "?").toUpperCase();
          addLog(`[${agentName}] Error: ${d.error ?? "unknown"}`);
          break;
        }

        // Legacy agent.step
        case "agent.step": {
          const agent = String(d.agent ?? "AGENT").toUpperCase();
          const msg   = String(d.message ?? JSON.stringify(d));
          addLog(`[${agent}] ${msg}`);
          break;
        }

        // ── Evolution Events ──────────────────────────────────────
        case "evolution.triggered":
        case "evolution.started": {
          setEvolutionActive(true);
          setEvolutionState({ status: "running", generated_skills: 0, failed_tasks: 0, last_run: null });
          const trigger = d.trigger ? String(d.trigger) : "auto";
          addLog(`[EVOLUTION] ⚡ Evolution triggered (${trigger})`);
          addNotification("Evolution cycle started", "info");
          break;
        }

        case "evolution.generated": {
          const skillName = d.skill ? String(d.skill) : undefined;
          if (skillName) {
            addSkill(skillName);
            addEvolutionEntry({
              version:      "v?",
              timestamp:    ev.timestamp ?? new Date().toISOString(),
              skills_added: [skillName],
            });
            addLog(`[EVOLUTION] ✓ New skill generated: ${skillName}`);
            addNotification(`New skill: ${skillName}`, "success");
          }
          break;
        }

        case "evolution.completed": {
          const newSkill   = d.skill_name ? String(d.skill_name) : undefined;
          const newVersion = d.version    ? String(d.version)    : undefined;
          if (newSkill) addSkill(newSkill);
          if (newVersion) setVersion(newVersion);
          setEvolutionState({
            status:           "idle",
            generated_skills: Number(d.skills_generated ?? 1),
            failed_tasks:     Number(d.failed_tasks ?? 0),
            last_run:         ev.timestamp ?? new Date().toISOString(),
          });
          addEvolutionEntry({
            version:      newVersion ?? "v1",
            timestamp:    ev.timestamp ?? new Date().toISOString(),
            skills_added: newSkill ? [newSkill] : [],
          });
          addLog(`[EVOLUTION] ✓ Complete${newVersion ? ` → ${newVersion}` : ""}${newSkill ? ` (+${newSkill})` : ""}`);
          addNotification(`Evolution complete!${newSkill ? ` New skill: ${newSkill}` : ""}`, "success");
          break;
        }

        case "evolution.validation_failed": {
          addLog(`[EVOLUTION] ✗ Validation failed for ${d.skill ?? "skill"}: ${d.reason ?? "unknown"}`);
          addNotification("Skill validation failed", "error");
          break;
        }

        case "evolution.failed": {
          setEvolutionState({ status: "error", generated_skills: 0, failed_tasks: 1, last_run: null });
          addLog(`[EVOLUTION] ✗ Failed: ${d.error ?? "unknown error"}`);
          addNotification("Evolution cycle failed", "error");
          break;
        }

        // ── Skill Events ──────────────────────────────────────────
        case "skill.executed": {
          const sn  = d.skill_name ? String(d.skill_name) : null;
          const dur = d.duration_ms ? ` (${d.duration_ms}ms)` : "";
          if (sn) addLog(`[SKILL] Executed: ${sn}${dur}`);
          break;
        }

        case "skill.error": {
          const sn = d.skill_name ? String(d.skill_name) : "skill";
          addLog(`[SKILL] Error in ${sn}: ${d.error ?? "unknown"}`);
          break;
        }

        // Legacy skill registration events
        case "skill.generated":
        case "skill.created":
        case "skill.registered": {
          const skillName = d.skill ?? d.name ?? d.skill_name;
          if (skillName) {
            addSkill(String(skillName));
            addLog(`[SKILL] New capability registered: ${skillName}`);
          }
          break;
        }

        // ── System ────────────────────────────────────────────────
        case "system.updated": {
          addLog(`[SYSTEM] Configuration updated`);
          break;
        }

        default: {
          addLog(`[EVENT:${type}] ${JSON.stringify(d)}`);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // ─── Connection ──────────────────────────────────────────────
  const connect = useCallback(() => {
    if (
      wsRef.current?.readyState === WebSocket.OPEN ||
      wsRef.current?.readyState === WebSocket.CONNECTING
    ) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      reconnectAttempts.current = 0;
      setSystemStatus("Live");
    };

    ws.onmessage = (event) => {
      try {
        // Plain text (backend may emit raw strings)
        if (typeof event.data === "string" && !event.data.startsWith("{")) {
          addLog(event.data);
          return;
        }

        const raw = JSON.parse(event.data) as Record<string, unknown>;

        // Handle AXON data contract format: { event, data, task_id, trace_id, timestamp }
        // Also handle legacy format: { type, payload }
        const wsEvent: WsEvent = {
          event:     String(raw.event ?? raw.type ?? "unknown"),
          trace_id:  raw.trace_id ? String(raw.trace_id) : undefined,
          task_id:   raw.task_id  ? String(raw.task_id)  : undefined,
          timestamp: raw.timestamp ? String(raw.timestamp) : undefined,
          data:      (raw.data ?? raw.payload ?? {}) as Record<string, unknown>,
          message:   raw.message ? String(raw.message) : undefined,
        };

        handleEvent(wsEvent);
      } catch {
        addLog(`[RAW] ${event.data}`);
      }
    };

    ws.onclose = () => {
      setSystemStatus("Idle");
      const delay = Math.min(30_000, Math.pow(2, reconnectAttempts.current) * 1_000);
      reconnectAttempts.current += 1;
      addLog(`[SYSTEM] Disconnected. Reconnecting in ${Math.round(delay / 1000)}s…`);
      reconnectTimer.current = setTimeout(connect, delay);
    };

    ws.onerror = () => {
      ws.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleEvent]);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };
  }, [connect]);
}
