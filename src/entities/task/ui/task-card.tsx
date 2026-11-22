import type { HTMLAttributes } from "react";

import { CalendarDays, MessageSquareText, TriangleAlert } from "lucide-react";

import type { TaskDTO, User } from "@/shared/api";
import { cn, formatDue } from "@/shared/lib";
import { AvatarStack } from "@/shared/ui";

import { STATUS_COLOR } from "../config/meta";
import { isOverdue } from "../lib/overdue";
import { PriorityBadge, StatusChip } from "./badges";

type Props = HTMLAttributes<HTMLDivElement> & {
  active?: boolean;
  assignees: User[];
  task: TaskDTO;
};

/** Карточка задачи: цветная полоса статуса слева, приоритет справа сверху */
export function TaskCard({
  task,
  assignees,
  active,
  className,
  ...rest
}: Props) {
  const done = task.status === "done";
  const overdue = isOverdue(task);
  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        "group relative cursor-default overflow-hidden rounded-2xl bg-surface p-3.5 pl-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition-all duration-200",
        "active:scale-[0.985] pointer-fine:hover:shadow-soft",
        active && "ring-2 ring-primary/50",
        className,
      )}
      {...rest}
    >
      <span
        className="absolute inset-y-0 left-0 w-1 transition-colors"
        style={{ background: STATUS_COLOR[task.status] }}
      />
      <div className="flex items-start gap-3">
        <h3
          className={cn(
            "line-clamp-2 flex-1 text-[1.0625rem] font-semibold leading-snug lg:text-[1rem]",
            done && "text-fg-2 line-through decoration-fg-2/70",
          )}
        >
          {task.title}
        </h3>
        <PriorityBadge priority={task.priority} />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
        <StatusChip status={task.status} />
        {task.dueAt && (
          <span
            className={cn(
              "inline-flex items-center gap-1 text-[0.8125rem]",
              overdue ? "font-semibold text-danger" : "text-fg-2",
            )}
          >
            {overdue ? (
              <TriangleAlert className="size-3.5" />
            ) : (
              <CalendarDays className="size-3.5" />
            )}
            {formatDue(task.dueAt)}
          </span>
        )}
        {task.tags.map((tag) => (
          <span key={tag} className="text-[0.8125rem] text-fg-2">
            #{tag}
          </span>
        ))}
      </div>
      {(assignees.length > 0 || task.commentsCount > 0) && (
        <div className="mt-2.5 flex items-center justify-between">
          <AvatarStack
            items={assignees.map((u) => ({
              id: u.id,
              spec: u.avatar,
              name: u.name,
            }))}
            max={3}
            size={1.5}
          />
          {task.commentsCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[0.8125rem] text-fg-3">
              <MessageSquareText className="size-3.5" />
              {task.commentsCount}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
