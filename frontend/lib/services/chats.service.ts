// ============================================================
// lib/services/chats.service.ts
// Chat session API — previously unused, now wired
// ============================================================

import { get, post, put, del } from "@/lib/http";
import { API_ROUTES } from "@/lib/constants";
import type { Chat, Task } from "@/types";
import { isTask, normalizeTask, unwrapItems } from "@/types/schemas";

export interface CreateChatPayload {
  title: string;
}

export interface UpdateChatPayload {
  title?: string;
}

function normalizeChat(raw: Record<string, unknown>): Chat {
  return {
    id:         String(raw.id ?? ""),
    title:      String(raw.title ?? "Untitled Chat"),
    created_at: String(raw.created_at ?? new Date().toISOString()),
    updated_at: String(raw.updated_at ?? raw.created_at ?? new Date().toISOString()),
  };
}

function isChat(v: unknown): v is Chat {
  if (!v || typeof v !== "object") return false;
  const c = v as Record<string, unknown>;
  return typeof c.id === "string" && typeof c.title === "string";
}

export const chatsService = {
  async list(): Promise<Chat[]> {
    const raw = await get<unknown>(API_ROUTES.CHATS);
    const items = unwrapItems(raw, isChat);
    return items.map((c) => normalizeChat(c as unknown as Record<string, unknown>));
  },

  async create(payload: CreateChatPayload): Promise<Chat> {
    const raw = await post<Record<string, unknown>>(API_ROUTES.CHATS, payload);
    return normalizeChat(raw);
  },

  async get(id: string): Promise<Chat> {
    const raw = await get<Record<string, unknown>>(API_ROUTES.CHAT(id));
    return normalizeChat(raw);
  },

  async update(id: string, payload: UpdateChatPayload): Promise<Chat> {
    const raw = await put<Record<string, unknown>>(API_ROUTES.CHAT(id), payload);
    return normalizeChat(raw);
  },

  async delete(id: string): Promise<void> {
    await del(API_ROUTES.CHAT(id));
  },

  async getTasks(id: string): Promise<Task[]> {
    const raw = await get<unknown>(API_ROUTES.CHAT_TASKS(id));
    const items = unwrapItems(raw, isTask);
    return items.map((t) => normalizeTask(t as unknown as Record<string, unknown>));
  },
} as const;
