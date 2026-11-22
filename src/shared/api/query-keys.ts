import type { TaskListParams } from "./types";

/** Ключи кэша TanStack Query в одном месте — их же инвалидирует realtime-мост */
export const qk = {
  me: ["me"] as const,
  users: ["users"] as const,
  departments: ["departments"] as const,
  chats: ["chats"] as const,
  chat: (id: string) => ["chats", id] as const,
  messages: (chatId: string) => ["messages", chatId] as const,
  tasksRoot: ["tasks"] as const,
  tasks: (params: TaskListParams) => ["tasks", params] as const,
  task: (id: string) => ["task", id] as const,
  comments: (taskId: string) => ["comments", taskId] as const,
  notifications: ["notifications"] as const,
  stories: ["stories"] as const,
  search: (q: string) => ["search", q] as const,
};
