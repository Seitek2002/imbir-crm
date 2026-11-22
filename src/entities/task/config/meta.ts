import type { TaskPriority, TaskStatus } from "@/shared/api";

/** Цвета статусов — по видео: фиолетовый бэклог, синий «к выполнению», бирюзовый «в работе» */
export const STATUS_COLOR: Record<TaskStatus, string> = {
  backlog: "#6c42fc",
  todo: "#3c7efc",
  in_progress: "#18baba",
  review: "#fc246c",
  done: "#06ae72",
};

export const PRIORITY_COLOR: Record<TaskPriority, string> = {
  low: "#8e8e93",
  medium: "#fc8400",
  high: "#fc302a",
  urgent: "#fc246c",
};

export const STATUSES: TaskStatus[] = [
  "backlog",
  "todo",
  "in_progress",
  "review",
  "done",
];
export const PRIORITIES: TaskPriority[] = ["low", "medium", "high", "urgent"];
