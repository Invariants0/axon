// ============================================================
// lib/services/index.ts
// Barrel export — import everything from "@/lib/services"
// ============================================================

export { tasksService }     from "./tasks.service";
export { evolutionService } from "./evolution.service";
export { skillsService }    from "./skills.service";
export { systemService }    from "./system.service";
export { chatsService }     from "./chats.service";

export type { CreateTaskPayload }   from "./tasks.service";
export type { TriggerEvolutionResult } from "./evolution.service";
export type { CreateChatPayload, UpdateChatPayload } from "./chats.service";
