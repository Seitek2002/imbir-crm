import type { TaskDTO } from "@/shared/api";
import { startOfDay } from "@/shared/lib";

/** Срок прошёл, а задача ещё не закрыта */
export function isOverdue(task: Pick<TaskDTO, "dueAt" | "status">) {
  return Boolean(
    task.dueAt &&
    task.status !== "done" &&
    new Date(task.dueAt) < startOfDay(new Date()),
  );
}
