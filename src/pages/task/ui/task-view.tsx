import { useState } from "react";
import { useNavigate } from "react-router";

import {
  CalendarDays,
  Check,
  CircleCheck,
  CircleDot,
  Clock3,
  FileText,
  Flag,
  ListTodo,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  TriangleAlert,
  UsersRound,
} from "lucide-react";

import { DueDateSheet } from "@/features/task-form";

import {
  PRIORITIES,
  PRIORITY_COLOR,
  PriorityBadge,
  STATUSES,
  STATUS_COLOR,
  StatusChip,
  isOverdue,
  useDeleteTask,
  useTask,
  useUpdateTask,
} from "@/entities/task";
import { UserAvatar, useUserMap } from "@/entities/user";

import type { CommentDTO } from "@/shared/api";
import {
  cn,
  formatDateTime,
  formatDue,
  formatFileSize,
  haptic,
  sanitizeHtml,
  useIsDesktop,
  useT,
} from "@/shared/lib";
import { toast, useSession } from "@/shared/model";
import {
  ActionSheet,
  BackButton,
  Button,
  ConfirmDialog,
  EmptyState,
  IconButton,
  NavBar,
  Screen,
  SectionLabel,
  Skeleton,
  TagChip,
} from "@/shared/ui";

import { TaskCommentComposer, TaskCommentsList } from "./task-comments";

export function TaskView({ taskId }: { taskId: string }) {
  const t = useT();
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const meId = useSession((s) => s.userId) ?? "";
  const { data: task, isLoading } = useTask(taskId);
  const users = useUserMap();
  const update = useUpdateTask();
  const del = useDeleteTask();
  const [sheet, setSheet] = useState<"due" | "priority" | "status" | null>(
    null,
  );
  const [confirm, setConfirm] = useState(false);
  const [replyTo, setReplyTo] = useState<CommentDTO | null>(null);
  const [tag, setTag] = useState("");

  if (isLoading && !task) {
    return (
      <Screen>
        <NavBar
          title={t.tasks.task}
          left={!isDesktop && <BackButton fallback="/tasks" />}
        />
        <div className="flex flex-col gap-3 p-4">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      </Screen>
    );
  }

  if (!task) {
    return (
      <Screen>
        <NavBar
          title={t.tasks.task}
          left={!isDesktop && <BackButton fallback="/tasks" />}
        />
        <EmptyState icon={<ListTodo />} title={t.common.nothingFound} />
      </Screen>
    );
  }

  const patch = (p: Parameters<typeof update.mutate>[0]["patch"]) =>
    update.mutate({ id: task.id, patch: p });
  const done = task.status === "done";
  const overdue = isOverdue(task);
  const author = users.get(task.creatorId);
  const assignees = task.assigneeIds
    .map((id) => users.get(id))
    .filter((u) => u !== undefined);

  const addTag = () => {
    const v = tag.trim().replace(/^#+/, "").replace(/\s+/g, "_");
    if (v && !task.tags.includes(v)) patch({ tags: [...task.tags, v] });
    setTag("");
  };

  return (
    <Screen>
      <NavBar
        title={t.tasks.task}
        left={!isDesktop && <BackButton fallback="/tasks" />}
        right={
          <>
            <IconButton
              label={t.tasks.editTask}
              onClick={() => navigate(`/tasks/${task.id}/edit`)}
            >
              <Pencil className="size-5!" />
            </IconButton>
            <IconButton
              label={t.tasks.delete}
              variant="danger"
              onClick={() => setConfirm(true)}
            >
              <Trash2 className="size-5!" />
            </IconButton>
          </>
        }
      />

      <div className="scroll-area min-h-0 flex-1 px-4 pb-6 lg:px-6">
        <div className="mx-auto max-w-3xl">
          <div className="relative overflow-hidden rounded-2xl bg-surface p-4 pl-5">
            <span
              className="absolute inset-y-0 left-0 w-1.5 transition-colors duration-500"
              style={{ background: STATUS_COLOR[task.status] }}
            />
            <h1
              className={cn(
                "text-[1.375rem] font-bold leading-tight transition-colors",
                done && "text-fg-2 line-through",
              )}
            >
              {task.title}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusChip
                status={task.status}
                onClick={() => setSheet("status")}
              />
              <PriorityBadge
                priority={task.priority}
                onClick={() => setSheet("priority")}
              />
              {task.teamName && (
                <span className="inline-flex items-center gap-1 text-[0.8125rem] text-fg-2">
                  <UsersRound className="size-3.5" /> {task.teamName}
                </span>
              )}
            </div>
            <Button
              variant={done ? "outline" : "tinted"}
              size="md"
              className="mt-4"
              icon={
                done ? (
                  <RotateCcw className="size-4" />
                ) : (
                  <CircleCheck className="size-4" />
                )
              }
              onClick={() => {
                haptic(done ? "light" : "success");
                patch({ status: done ? "in_progress" : "done" });
              }}
            >
              {done ? t.tasks.reopen : t.tasks.markDone}
            </Button>
          </div>

          <div className="mt-3 rounded-2xl bg-surface p-4">
            {task.descriptionHtml ? (
              <div
                className="rich-text selectable text-[1rem] leading-relaxed lg:text-[0.9375rem]"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(task.descriptionHtml),
                }}
              />
            ) : (
              <p className="text-[0.9375rem] text-fg-3">
                {t.tasks.noDescription}
              </p>
            )}
          </div>

          <div className="mt-3 divide-y divide-separator overflow-hidden rounded-2xl bg-surface">
            <button
              type="button"
              onClick={() => setSheet("due")}
              className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-surface-2"
            >
              {overdue ? (
                <TriangleAlert className="size-5 text-danger" />
              ) : (
                <CalendarDays className="size-5 text-fg-2" />
              )}
              <span className="flex-1 text-[0.9375rem] text-fg-2">
                {t.tasks.deadline}
              </span>
              <span
                className={cn(
                  "text-[0.9375rem] font-medium",
                  overdue && "text-danger",
                )}
              >
                {task.dueAt ? formatDue(task.dueAt) : t.tasks.noDeadline}
              </span>
            </button>
            <div className="flex items-center gap-3 px-4 py-3">
              <Clock3 className="size-5 text-fg-2" />
              <span className="flex-1 text-[0.9375rem] text-fg-2">
                {t.tasks.createdAt}
              </span>
              <span className="text-[0.9375rem] font-medium">
                {formatDateTime(task.createdAt)}
              </span>
            </div>
            <div className="flex items-center gap-3 px-4 py-3">
              <UserAvatar user={author} size={1.5} />
              <span className="flex-1 text-[0.9375rem] text-fg-2">
                {t.tasks.author}
              </span>
              <span className="truncate text-[0.9375rem] font-medium">
                {author?.name}
              </span>
            </div>
          </div>

          <SectionLabel className="px-1">
            {t.tasks.assignees} {task.assignAll ? "" : assignees.length}
          </SectionLabel>
          <div className="overflow-hidden rounded-2xl bg-surface">
            {task.assignAll ? (
              <div className="flex items-center gap-3 px-4 py-3 text-[0.9375rem]">
                <UsersRound className="size-5 text-primary" />{" "}
                {t.tasks.allTeamAssigned}
              </div>
            ) : (
              assignees.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center gap-3 border-b border-separator px-4 py-2.5 last:border-0"
                >
                  <UserAvatar user={u} size={2.25} withPresence />
                  <span className="min-w-0 flex-1 truncate text-[1rem]">
                    {u.name}
                  </span>
                  <span className="flex size-6 items-center justify-center rounded-full bg-primary text-white">
                    <Check className="size-3.5" strokeWidth={3} />
                  </span>
                </div>
              ))
            )}
          </div>

          <SectionLabel className="px-1">{t.tasks.tags}</SectionLabel>
          <div className="rounded-2xl bg-surface p-3">
            {task.tags.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {task.tags.map((x) => (
                  <TagChip
                    key={x}
                    label={x}
                    onRemove={() =>
                      patch({ tags: task.tags.filter((y) => y !== x) })
                    }
                  />
                ))}
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="pl-1 text-fg-3">#</span>
              <input
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTag()}
                placeholder={t.tasks.addTag}
                className="h-9 flex-1 bg-transparent text-[0.9375rem] outline-none placeholder:text-fg-3"
              />
              <button
                type="button"
                onClick={addTag}
                className="pressable flex size-7 items-center justify-center rounded-full bg-primary text-white"
                aria-label={t.tasks.addTag}
              >
                <Plus className="size-4" strokeWidth={3} />
              </button>
            </div>
          </div>

          {task.files.length > 0 && (
            <>
              <SectionLabel className="px-1">{t.tasks.files}</SectionLabel>
              <div className="divide-y divide-separator overflow-hidden rounded-2xl bg-surface">
                {task.files.map((f) => (
                  <a
                    key={f.id}
                    href={f.url}
                    download={f.name}
                    onClick={(e) => {
                      if (!f.url) {
                        e.preventDefault();
                        toast.show(t.common.demoOnly);
                      }
                    }}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <FileText className="size-5 text-primary" />
                    <span className="min-w-0 flex-1 truncate text-[0.9375rem]">
                      {f.name}
                    </span>
                    <span className="text-[0.75rem] text-fg-3">
                      {formatFileSize(f.size)}
                    </span>
                  </a>
                ))}
              </div>
            </>
          )}

          <SectionLabel className="px-1">{t.tasks.comments}</SectionLabel>
          <TaskCommentsList taskId={task.id} meId={meId} onReply={setReplyTo} />
        </div>
      </div>

      <TaskCommentComposer
        taskId={task.id}
        meId={meId}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
      />

      <ActionSheet
        open={sheet === "status"}
        onClose={() => setSheet(null)}
        title={t.tasks.changeStatus}
        cancelLabel={t.common.cancel}
        options={STATUSES.map((s) => ({
          label: t.tasks.statuses[s],
          icon: <CircleDot style={{ color: STATUS_COLOR[s] }} />,
          selected: s === task.status,
          onSelect: () => patch({ status: s }),
        }))}
      />
      <ActionSheet
        open={sheet === "priority"}
        onClose={() => setSheet(null)}
        title={t.tasks.changePriority}
        cancelLabel={t.common.cancel}
        options={[...PRIORITIES].reverse().map((p) => ({
          label: t.tasks.priorities[p],
          icon: <Flag style={{ color: PRIORITY_COLOR[p] }} />,
          selected: p === task.priority,
          onSelect: () => patch({ priority: p }),
        }))}
      />
      <DueDateSheet
        open={sheet === "due"}
        value={task.dueAt}
        onClose={() => setSheet(null)}
        onChange={(v) => patch({ dueAt: v })}
      />
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={() => {
          del.mutate(task.id);
          setConfirm(false);
          toast.show(t.tasks.deleted);
          navigate("/tasks", { replace: true });
        }}
        icon={<Trash2 />}
        title={t.tasks.deleteTitle}
        description={t.tasks.deleteText}
        confirmLabel={t.common.delete}
        cancelLabel={t.common.cancel}
        variant="danger"
      />
    </Screen>
  );
}
