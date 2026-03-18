import { create } from 'zustand';

interface Task {
  id: string;
  name: string;
  status: 'success' | 'fail' | 'pending';
  version: string;
  time: string;
}

interface AppState {
  isEvolutionActive: boolean;
  setEvolutionActive: (active: boolean) => void;
  logs: string[];
  addLog: (log: string) => void;
  persona: 'Engineer' | 'Researcher' | 'Hacker' | 'Minimal Agent';
  setPersona: (persona: 'Engineer' | 'Researcher' | 'Hacker' | 'Minimal Agent') => void;
  version: string;
  setVersion: (version: string) => void;
  systemStatus: 'Live' | 'Idle' | 'Evolving';
  setSystemStatus: (status: 'Live' | 'Idle' | 'Evolving') => void;
  activeAgents: number;
  setActiveAgents: (count: number) => void;
  skills: string[];
  addSkill: (skill: string) => void;
  plannedSkills: string[];
  installSkill: (skill: string) => void;
  tasks: Task[];
  addTask: (task: Task) => void;
  updateTaskStatus: (id: string, status: 'success' | 'fail' | 'pending') => void;
  isAutoTaskEnabled: boolean;
  setIsAutoTaskEnabled: (enabled: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isEvolutionActive: false,
  setEvolutionActive: (active) => set({ isEvolutionActive: active, systemStatus: active ? 'Evolving' : 'Idle' }),
  logs: [],
  addLog: (log) => set((state) => ({ logs: [...state.logs, log] })),
  persona: 'Engineer',
  setPersona: (persona) => set({ persona }),
  version: 'v0',
  setVersion: (version) => set({ version }),
  systemStatus: 'Idle',
  setSystemStatus: (status) => set({ systemStatus: status }),
  activeAgents: 4,
  setActiveAgents: (count) => set({ activeAgents: count }),
  skills: ['reasoning', 'planning', 'coding'],
  addSkill: (skill) => set((state) => ({ skills: [...state.skills, skill] })),
  plannedSkills: ['web_search', 'file_explorer', 'api_integration', 'image_generation'],
  installSkill: (skill) => set((state) => ({
    skills: [...state.skills, skill],
    plannedSkills: state.plannedSkills.filter(s => s !== skill)
  })),
  tasks: [
    { id: '1', name: 'Find latest AI news', status: 'fail', version: 'v0', time: '10s' }
  ],
  addTask: (task) => set((state) => ({ tasks: [task, ...state.tasks] })),
  updateTaskStatus: (id, status) => set((state) => ({
    tasks: state.tasks.map(t => t.id === id ? { ...t, status } : t)
  })),
  isAutoTaskEnabled: false,
  setIsAutoTaskEnabled: (enabled) => set({ isAutoTaskEnabled: enabled }),
}));
