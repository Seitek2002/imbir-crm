import { useCallback, useMemo, useRef, useState } from "react";

import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  CircleDot,
  Flag,
  Languages,
  Mic,
  Paperclip,
  Plus,
  Trash2,
  UsersRound,
  X,
} from "lucide-react";

import { useChats } from "@/entities/chat";
import {
  PRIORITIES,
  PRIORITY_COLOR,
  STATUSES,
  STATUS_COLOR,
  useCreateTask,
  useUpdateTask,
} from "@/entities/task";
import { UserAvatar, useUsers } from "@/entities/user";

import type {
  Attachment,
  TaskDTO,
  TaskInput,
  TaskPriority,
  TaskStatus,
} from "@/shared/api";
import {
  cn,
  fileToAttachment,
  formatFileSize,
  formatShortDate,
  haptic,
  useT,
} from "@/shared/lib";
import { toast } from "@/shared/model";
import { ActionSheet, Button, TagChip } from "@/shared/ui";

import { useDictation } from "../lib/use-dictation";
import { DueDateSheet } from "./due-date-sheet";
import { RichEditor, type RichEditorHandle } from "./rich-editor";

export type TaskFormPrefill = {
  descriptionHtml?: string;
  dueAt?: string;
  teamChatId?: string;
  title?: string;
};

type Props = {
  meId: string;
  onDone: (taskId: string) => void;
  prefill?: TaskFormPrefill;
  task?: TaskDTO;
};

function SelectCard({
  icon,
  label,
  value,
  color,
  onClick,
}: {
  color?: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  value: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="pressable flex min-w-0 flex-1 items-center gap-2.5 rounded-2xl bg-surface p-3 text-left shadow-[0_1px_2px_rgb(0_0_0/0.04)]"
    >
      <span
        className="flex size-8 shrink-0 items-center justify-center rounded-full [&_svg]:size-4"
        style={{
          color,
          background: color
            ? `color-mix(in srgb, ${color} 14%, transparent)`
            : undefined,
        }}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[0.6875rem] text-fg-2">{label}</span>
        <span className="block truncate text-[0.9375rem] font-semibold">
          {value}
        </span>
      </span>
      <ChevronDown className="size-4 shrink-0 text-fg-3" />
    </button>
  );
}

export function TaskForm({ meId, task, prefill, onDone }: Props) {
  const t = useT();
  const editing = Boolean(task);
  const { data: chats } = useChats();
  const { data: users } = useUsers();
  const create = useCreateTask();
  const update = useUpdateTask();
  const editor = useRef<RichEditorHandle>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const teams = useMemo(
    () => (chats ?? []).filter((c) => c.kind === "group"),
    [chats],
  );
  const defaultTeam =
    prefill?.teamChatId ??
    task?.teamChatId ??
    teams.find((c) => c.title === "Маркетинг")?.id ??
    teams[0]?.id ??
    null;

  const [title, setTitle] = useState(task?.title ?? prefill?.title ?? "");
  const [html, setHtml] = useState(
    task?.descriptionHtml ?? prefill?.descriptionHtml ?? "",
  );
  const [priority, setPriority] = useState<TaskPriority>(
    task?.priority ?? "medium",
  );
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? "todo");
  const [teamId, setTeamId] = useState<null | string>(task?.teamChatId ?? null);
  const [assignAll, setAssignAll] = useState(task?.assignAll ?? false);
  const [assignees, setAssignees] = useState<string[]>(
    task?.assigneeIds ?? [meId],
  );
  const [dueAt, setDueAt] = useState<null | string>(
    task?.dueAt ?? prefill?.dueAt ?? null,
  );
  const [tags, setTags] = useState<string[]>(task?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [files, setFiles] = useState<Attachment[]>(task?.files ?? []);
  const [sheet, setSheet] = useState<
    "due" | "priority" | "status" | "team" | "translate" | null
  >(null);
  const [titleError, setTitleError] = useState(0);

  const effectiveTeamId = teamId ?? defaultTeam;
  const team = teams.find((c) => c.id === effectiveTeamId);
  const teamMembers = useMemo(
    () => (users ?? []).filter((u) => team?.memberIds.includes(u.id)),
    [users, team],
  );

  const onDictated = useCallback(
    (text: string) => editor.current?.appendText(text),
    [],
  );
  const dictation = useDictation(onDictated);

  const addTag = () => {
    const v = tagInput
      .trim()
      .replace(/^#+/, "")
      .replace(/\s+/g, "_")
      .slice(0, 32);
    if (v && !tags.includes(v)) {
      haptic("light");
      setTags([...tags, v]);
    }
    setTagInput("");
  };

  const submit = () => {
    if (!title.trim()) {
      setTitleError((n) => n + 1);
      haptic("error");
      titleRef.current?.focus();
      return toast.error(t.tasks.nameRequired);
    }
    const input: TaskInput = {
      title: title.trim(),
      descriptionHtml: html,
      status,
      priority,
      teamChatId: effectiveTeamId,
      assignAll,
      assigneeIds: assignAll ? [] : assignees,
      dueAt,
      tags,
      files,
    };
    if (task) {
      update.mutate(
        { id: task.id, patch: input },
        {
          onSuccess: () => {
            toast.success(t.tasks.saved);
            onDone(task.id);
          },
        },
      );
    } else {
      create.mutate(input, {
        onSuccess: (created) => {
          haptic("success");
          toast.success(t.tasks.created);
          onDone(created.id);
        },
      });
    }
  };

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div className="scroll-area min-h-0 flex-1 px-4 pb-32 pt-1 lg:px-6">
        <input
          key={titleError}
          ref={titleRef}
          autoFocus={!editing}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t.tasks.namePlaceholder}
          className={cn(
            "mb-3 h-14 w-full rounded-2xl bg-surface px-4 text-[1.25rem] font-bold outline-none placeholder:text-fg-3 focus:ring-2 focus:ring-primary/25",
            titleError > 0 && "animate-shake",
          )}
        />

        <RichEditor
          ref={editor}
          initialHtml={html}
          placeholder={t.tasks.descriptionPlaceholder}
          onChange={setHtml}
        />

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => {
              if (dictation.listening) return dictation.stop();
              if (!dictation.supported || !dictation.start())
                toast.error(t.tasks.dictationUnsupported);
            }}
            className={cn(
              "pressable inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[0.875rem] font-semibold transition-colors",
              dictation.listening
                ? "bg-danger text-white"
                : "bg-primary-soft text-primary",
            )}
          >
            <Mic
              className={cn("size-4", dictation.listening && "animate-pulse")}
            />
            {dictation.listening ? t.tasks.listening : t.tasks.dictation}
          </button>
          <button
            type="button"
            onClick={() => setSheet("translate")}
            className="pressable inline-flex h-9 items-center gap-1.5 rounded-full bg-primary-soft px-3.5 text-[0.875rem] font-semibold text-primary"
          >
            <Languages className="size-4" />
            {t.tasks.translate}
          </button>
        </div>

        <div className="mt-4 flex gap-2.5">
          <SelectCard
            icon={<Flag />}
            label={t.tasks.priority}
            value={t.tasks.priorities[priority]}
            color={PRIORITY_COLOR[priority]}
            onClick={() => setSheet("priority")}
          />
          <SelectCard
            icon={<CircleDot />}
            label={t.tasks.status}
            value={t.tasks.statuses[status]}
            color={STATUS_COLOR[status]}
            onClick={() => setSheet("status")}
          />
        </div>

        <button
          type="button"
          onClick={() => setSheet("team")}
          className="mt-4 flex items-center gap-1.5 text-[0.875rem] text-fg-2"
        >
          <UsersRound className="size-4" />
          {t.tasks.team(team?.title ?? "—")}
          <ChevronRight className="size-4" />
        </button>

        <div className="mt-3 text-[0.8125rem] font-medium text-fg-2">
          {t.tasks.assign}
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2 rounded-2xl bg-surface p-1">
          {[
            { all: true, label: t.tasks.wholeTeam },
            { all: false, label: t.tasks.people },
          ].map((o) => (
            <button
              key={o.label}
              type="button"
              onClick={() => {
                haptic("light");
                setAssignAll(o.all);
              }}
              className={cn(
                "h-11 rounded-xl text-[0.9375rem] font-semibold transition-all duration-300",
                assignAll === o.all
                  ? "bg-primary text-white shadow-[0_6px_14px_-6px_rgb(252_36_108/0.7)]"
                  : "text-fg",
              )}
            >
              {o.label}
            </button>
          ))}
        </div>

        <div className="mt-2 overflow-hidden rounded-2xl bg-surface">
          {assignAll ? (
            <div className="flex flex-wrap gap-1.5 p-3">
              {teamMembers.map((u) => (
                <span
                  key={u.id}
                  className="inline-flex h-8 animate-pop-in items-center gap-1.5 rounded-full border border-separator pl-1 pr-3 text-[0.875rem]"
                >
                  <UserAvatar user={u} size={1.5} />
                  {u.name.split(" ")[0]}
                </span>
              ))}
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {teamMembers.map((u) => {
                const on = assignees.includes(u.id);
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      haptic("light");
                      setAssignees(
                        on
                          ? assignees.filter((x) => x !== u.id)
                          : [...assignees, u.id],
                      );
                    }}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors active:bg-surface-2 pointer-fine:hover:bg-surface-2/60"
                  >
                    <UserAvatar user={u} size={2.25} />
                    <span className="min-w-0 flex-1 truncate text-[1rem]">
                      {u.name}
                    </span>
                    <span
                      className={cn(
                        "flex size-6 items-center justify-center rounded-full border-[1.5px] transition-all",
                        on
                          ? "border-primary bg-primary text-white"
                          : "border-fg-3",
                      )}
                    >
                      {on && (
                        <Check
                          className="size-3.5 animate-pop-in"
                          strokeWidth={3}
                        />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setSheet("due")}
          className="pressable mt-4 flex w-full items-center gap-3 rounded-2xl bg-surface p-3.5 text-left"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary-soft text-primary">
            <CalendarDays className="size-4" />
          </span>
          <span
            className={cn(
              "flex-1 text-[1rem]",
              dueAt ? "font-semibold" : "text-fg-2",
            )}
          >
            {dueAt
              ? `${t.tasks.deadline}: ${formatShortDate(dueAt)}`
              : t.tasks.deadlineOptional}
          </span>
          {dueAt ? (
            <span
              role="button"
              onClick={(e) => {
                e.stopPropagation();
                setDueAt(null);
              }}
              className="p-1 text-fg-3"
            >
              <X className="size-4" />
            </span>
          ) : (
            <ChevronRight className="size-5 text-fg-3" />
          )}
        </button>

        <div className="mt-3 rounded-2xl bg-surface p-3">
          <div className="flex items-center gap-2">
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  addTag();
                }
              }}
              placeholder={t.tasks.tags}
              className="h-9 flex-1 bg-transparent px-1 text-[1rem] outline-none placeholder:text-fg-3"
            />
            <button
              type="button"
              onClick={addTag}
              aria-label={t.tasks.addTag}
              className="pressable flex size-7 items-center justify-center rounded-full bg-primary text-white"
            >
              <Plus className="size-4" strokeWidth={3} />
            </button>
          </div>
          {tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <TagChip
                  key={tag}
                  label={tag}
                  onRemove={() => setTags(tags.filter((x) => x !== tag))}
                />
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 text-[0.8125rem] font-medium text-fg-2">
          {t.tasks.files}
        </div>
        <div className="mt-2 overflow-hidden rounded-2xl bg-surface">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex w-full items-center gap-3 p-3.5 text-left active:bg-surface-2"
          >
            <span className="flex size-8 items-center justify-center rounded-lg bg-teal/15 text-teal">
              <Paperclip className="size-4" />
            </span>
            <span className="flex-1 text-[1rem]">{t.tasks.attachFile}</span>
            <Plus className="size-5 text-fg-3" />
          </button>
          {files.length === 0 ? (
            <div className="px-4 pb-3 text-[0.8125rem] text-fg-3">
              {t.tasks.noFiles}
            </div>
          ) : (
            files.map((f) => (
              <div
                key={f.id}
                className="flex animate-fade-in items-center gap-3 border-t border-separator px-4 py-2.5"
              >
                <span className="min-w-0 flex-1 truncate text-[0.9375rem]">
                  {f.name}
                </span>
                <span className="text-[0.75rem] text-fg-3">
                  {formatFileSize(f.size)}
                </span>
                <button
                  type="button"
                  onClick={() => setFiles(files.filter((x) => x.id !== f.id))}
                  className="p-1 text-danger"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          multiple
          hidden
          onChange={async (e) => {
            const list = Array.from(e.target.files ?? []);
            e.target.value = "";
            for (const f of list) {
              const { attachment } = await fileToAttachment(f);
              setFiles((prev) => [...prev, attachment]);
            }
          }}
        />
      </div>

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-bg via-bg/95 to-transparent px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-6 lg:px-6">
        <Button
          block
          onClick={submit}
          loading={create.isPending || update.isPending}
        >
          {editing ? t.tasks.save : t.tasks.create}
        </Button>
      </div>

      <ActionSheet
        open={sheet === "priority"}
        onClose={() => setSheet(null)}
        title={t.tasks.priority}
        cancelLabel={t.common.cancel}
        options={[...PRIORITIES].reverse().map((p) => ({
          label: t.tasks.priorities[p],
          icon: <Flag style={{ color: PRIORITY_COLOR[p] }} />,
          selected: p === priority,
          onSelect: () => setPriority(p),
        }))}
      />
      <ActionSheet
        open={sheet === "status"}
        onClose={() => setSheet(null)}
        title={t.tasks.status}
        cancelLabel={t.common.cancel}
        options={STATUSES.map((s) => ({
          label: t.tasks.statuses[s],
          icon: <CircleDot style={{ color: STATUS_COLOR[s] }} />,
          selected: s === status,
          onSelect: () => setStatus(s),
        }))}
      />
      <ActionSheet
        open={sheet === "team"}
        onClose={() => setSheet(null)}
        title={t.tasks.teamPick}
        cancelLabel={t.common.cancel}
        options={teams.map((c) => ({
          label: c.title,
          icon: <UsersRound />,
          selected: c.id === effectiveTeamId,
          onSelect: () => {
            setTeamId(c.id);
            setAssignees((a) => a.filter((id) => c.memberIds.includes(id)));
          },
        }))}
      />
      <ActionSheet
        open={sheet === "translate"}
        onClose={() => setSheet(null)}
        title={t.tasks.translateTo}
        cancelLabel={t.common.cancel}
        options={["English", "Русский", "Кыргызча"].map((lang) => ({
          label: lang,
          onSelect: () => toast.show(t.common.soon),
        }))}
      />
      <DueDateSheet
        open={sheet === "due"}
        value={dueAt}
        onClose={() => setSheet(null)}
        onChange={setDueAt}
      />
    </div>
  );
}
