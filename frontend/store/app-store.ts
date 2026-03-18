import { create } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";
import type {
  Task,
  Skill,
  EvolutionState,
  SystemHealth,
  Notification,
  PersonaMode,
} from "@/types";

// ─────────────────────────────────────────────────────────────
// App Store — Centralized state with persistence + subscriptions
// ─────────────────────────────────────────────────────────────

interface AppState {
  // ── System ──────────────────────────────────────────────────
  version: string;
  setVersion: (v: string) => void;
  systemStatus: "Live" | "Idle" | "Evolving";
  setSystemStatus: (s: "Live" | "Idle" | "Evolving") => void;
  activeAgents: number;
  setActiveAgents: (n: number) => void;
  systemHealth: SystemHealth | null;
  setSystemHealth: (h: SystemHealth) => void;

  // ── Persona ──────────────────────────────────────────────────
  persona: PersonaMode;
  setPersona: (p: PersonaMode) => void;

  // ── Tasks ────────────────────────────────────────────────────
  tasks: Task[];
  addTask: (task: Task) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  updateTaskStatus: (id: string, status: Task["status"]) => void;
  setTasks: (tasks: Task[]) => void;
  clearTasks: () => void;

  // ── Skills ───────────────────────────────────────────────────
  skills: string[];           // installed skill names (fast access)
  skillDetails: Skill[];       // full skill objects from API
  addSkill: (skill: string) => void;
  setSkillDetails: (skills: Skill[]) => void;
  plannedSkills: string[];
  installSkill: (skill: string) => void;

  // ── Evolution ────────────────────────────────────────────────
  isEvolutionActive: boolean;
  setEvolutionActive: (active: boolean) => void;
  evolutionState: EvolutionState | null;
  setEvolutionState: (state: EvolutionState) => void;
  evolutionHistory: { version: string; timestamp: string; skills_added: string[] }[];
  addEvolutionEntry: (entry: { version: string; timestamp: string; skills_added: string[] }) => void;

  // ── Logs ─────────────────────────────────────────────────────
  logs: string[];
  addLog: (log: string) => void;
  clearLogs: () => void;

  // ── Notifications ────────────────────────────────────────────
  notifications: Notification[];
  addNotification: (msg: string, type?: Notification["type"]) => void;
  dismissNotification: (id: string) => void;

  // ── UI ───────────────────────────────────────────────────────
  isAutoTaskEnabled: boolean;
  setIsAutoTaskEnabled: (v: boolean) => void;
  apiKey: string;
  setApiKey: (key: string) => void;
}

export const useAppStore = create<AppState>()(
  subscribeWithSelector(
    persist(
      (set, _get) => ({
        // ── System ──────────────────────────────────────────────
        version: "v0",
        setVersion: (version) => set({ version }),
        systemStatus: "Idle",
        setSystemStatus: (systemStatus) => set({ systemStatus }),
        activeAgents: 4,
        setActiveAgents: (activeAgents) => set({ activeAgents }),
        systemHealth: null,
        setSystemHealth: (systemHealth) => set({ systemHealth }),

        // ── Persona ─────────────────────────────────────────────
        persona: "operator",
        setPersona: (persona) => set({ persona }),

        // ── Tasks ───────────────────────────────────────────────
        tasks: [],
        addTask: (task) =>
          set((state) => {
            if (state.tasks.find((t) => t.id === task.id)) return state;
            return { tasks: [task, ...state.tasks] };
          }),
        updateTask: (id, patch) =>
          set((state) => ({
            tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
          })),
        updateTaskStatus: (id, status) =>
          set((state) => ({
            tasks: state.tasks.map((t) => (t.id === id ? { ...t, status } : t)),
          })),
        setTasks: (tasks) => set({ tasks }),
        clearTasks: () => set({ tasks: [] }),

        // ── Skills ──────────────────────────────────────────────
        skills: ["reasoning", "planning", "coding"],
        skillDetails: [],
        addSkill: (skill) =>
          set((state) =>
            state.skills.includes(skill)
              ? state
              : {
                  skills: [...state.skills, skill],
                  plannedSkills: state.plannedSkills.filter((s) => s !== skill),
                }
          ),
        setSkillDetails: (skillDetails) =>
          set({ skillDetails, skills: skillDetails.map((s) => s.name) }),
        plannedSkills: ["web_search", "file_explorer", "api_integration", "image_generation"],
        installSkill: (skill) =>
          set((state) => ({
            skills: state.skills.includes(skill) ? state.skills : [...state.skills, skill],
            plannedSkills: state.plannedSkills.filter((s) => s !== skill),
          })),

        // ── Evolution ───────────────────────────────────────────
        isEvolutionActive: false,
        setEvolutionActive: (isEvolutionActive) =>
          set({
            isEvolutionActive,
            systemStatus: isEvolutionActive ? "Evolving" : "Live",
          }),
        evolutionState: null,
        setEvolutionState: (evolutionState) =>
          set({
            evolutionState,
            isEvolutionActive: evolutionState.status === "running",
            systemStatus:
              evolutionState.status === "running"
                ? "Evolving"
                : evolutionState.status === "idle"
                ? "Live"
                : "Idle",
          }),
        evolutionHistory: [],
        addEvolutionEntry: (entry) =>
          set((state) => ({ evolutionHistory: [...state.evolutionHistory, entry] })),

        // ── Logs ────────────────────────────────────────────────
        logs: [],
        addLog: (log) =>
          set((state) => ({
            // Keep max 500 log lines to avoid memory issues
            logs: [...state.logs.slice(-499), log],
          })),
        clearLogs: () => set({ logs: [] }),

        // ── Notifications ────────────────────────────────────────
        notifications: [],
        addNotification: (msg, type = "info") =>
          set((state) => ({
            notifications: [
              ...state.notifications.slice(-9),
              {
                id: `${Date.now()}-${Math.random()}`,
                type,
                message: msg,
                timestamp: Date.now(),
                autoDismiss: true,
              },
            ],
          })),
        dismissNotification: (id) =>
          set((state) => ({
            notifications: state.notifications.filter((n) => n.id !== id),
          })),

        // ── UI ──────────────────────────────────────────────────
        isAutoTaskEnabled: false,
        setIsAutoTaskEnabled: (isAutoTaskEnabled) => set({ isAutoTaskEnabled }),
        apiKey: "",
        setApiKey: (apiKey) => set({ apiKey }),
      }),
      {
        name: "axon-app-store",
        // Only persist non-volatile items
        partialize: (state) => ({
          persona: state.persona,
          apiKey: state.apiKey,
          skills: state.skills,
          plannedSkills: state.plannedSkills,
          version: state.version,
          isAutoTaskEnabled: state.isAutoTaskEnabled,
        }),
      }
    )
  )
);
