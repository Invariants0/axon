"use client";

import { TaskList } from "@/components/ui/task-list";

export default function ExecutionPage() {
  return (
    <div className="h-full p-4 lg:p-6 flex flex-col min-h-0">
      <TaskList />
    </div>
  );
}
