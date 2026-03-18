// Task service — delegates to the centralized api-client.ts
// Kept as a class for backwards compat with AxonChat and other callers

import { tasksApi } from "@/lib/api-client";
import type { Task } from "@/types";

export class TaskService {
  static createTask(title: string, description?: string) {
    return tasksApi.create(title, description);
  }

  static getTasks(limit = 50) {
    return tasksApi.list(limit);
  }

  static getTaskById(id: string) {
    return tasksApi.get(id);
  }

  static getTaskTimeline(id: string) {
    return tasksApi.timeline(id);
  }
}
