import { CircleDot, MessageCircle } from "lucide-react";

import { messagePreview } from "@/entities/chat";
import { STATUS_COLOR } from "@/entities/task";
import { UserAvatar } from "@/entities/user";

import { cn, formatChatDate, useT } from "@/shared/lib";
import { Avatar } from "@/shared/ui";

import type { SearchItem } from "../lib/use-search";

/** Подсветка совпадения в тексте */
export function Highlight({ text, query }: { query: string; text: string }) {
  const q = query.trim();
  if (!q) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded bg-primary/15 px-0.5 text-primary">
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  );
}

type Props = {
  active?: boolean;
  item: SearchItem;
  onClick: () => void;
  onHover?: () => void;
  query: string;
};

export function SearchResultRow({
  item,
  query,
  active,
  onClick,
  onHover,
}: Props) {
  const t = useT();
  const base = cn(
    "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors active:bg-surface-2",
    active ? "bg-primary-soft" : "pointer-fine:hover:bg-surface-2/70",
  );

  if (item.type === "chat") {
    const c = item.chat;
    return (
      <button
        type="button"
        className={base}
        onClick={onClick}
        onMouseEnter={onHover}
      >
        <Avatar spec={c.avatar} name={c.title} size={2.75} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[1rem] font-semibold">
            <Highlight text={c.title} query={query} />
          </span>
          <span className="block truncate text-[0.8125rem] text-fg-2">
            {c.handle && <span className="text-blue">@{c.handle}</span>}{" "}
            {c.kind !== "direct" && t.chats.members(c.membersCount)}
          </span>
        </span>
      </button>
    );
  }
  if (item.type === "task") {
    const task = item.task;
    return (
      <button
        type="button"
        className={base}
        onClick={onClick}
        onMouseEnter={onHover}
      >
        <span
          className="flex size-11 shrink-0 items-center justify-center rounded-xl"
          style={{
            color: STATUS_COLOR[task.status],
            background: `color-mix(in srgb, ${STATUS_COLOR[task.status]} 14%, transparent)`,
          }}
        >
          <CircleDot className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span
            className={cn(
              "block truncate text-[1rem] font-semibold",
              task.status === "done" && "text-fg-2 line-through",
            )}
          >
            <Highlight text={task.title} query={query} />
          </span>
          <span className="block truncate text-[0.8125rem] text-fg-2">
            {t.tasks.statuses[task.status]} ·{" "}
            {t.tasks.priorities[task.priority]}
            {task.tags.length > 0 && ` · #${task.tags.join(" #")}`}
          </span>
        </span>
      </button>
    );
  }
  if (item.type === "person") {
    const u = item.user;
    return (
      <button
        type="button"
        className={base}
        onClick={onClick}
        onMouseEnter={onHover}
      >
        <UserAvatar user={u} size={2.75} withPresence />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[1rem] font-semibold">
            <Highlight text={u.name} query={query} />
          </span>
          <span className="block truncate text-[0.8125rem] text-fg-2">
            {u.position} · {u.email}
          </span>
        </span>
      </button>
    );
  }
  return (
    <button
      type="button"
      className={base}
      onClick={onClick}
      onMouseEnter={onHover}
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-surface-2 text-fg-2">
        <MessageCircle className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="truncate text-[0.9375rem] font-semibold">
            {item.chatTitle}
          </span>
          <span className="shrink-0 text-[0.75rem] text-fg-3">
            {formatChatDate(item.message.createdAt)}
          </span>
        </span>
        <span className="line-clamp-2 text-[0.8125rem] text-fg-2">
          <Highlight text={messagePreview(item.message, t)} query={query} />
        </span>
      </span>
    </button>
  );
}
