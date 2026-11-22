import { useMemo, useRef, useState } from "react";

import {
  ArrowUp,
  AtSign,
  Paperclip,
  Pin,
  PinOff,
  Reply,
  Trash2,
  X,
} from "lucide-react";

import { RichText } from "@/entities/message";
import {
  useAddComment,
  useComments,
  useDeleteComment,
  usePinComment,
} from "@/entities/task";
import { UserAvatar, firstName, useUserMap, useUsers } from "@/entities/user";

import type { CommentDTO } from "@/shared/api";
import { cn, formatDateTime, haptic, useIsDesktop, useT } from "@/shared/lib";
import { toast } from "@/shared/model";
import { AutoTextarea, Skeleton } from "@/shared/ui";

type Props = { meId: string; taskId: string };

/** Лента комментариев задачи */
export function TaskCommentsList({
  taskId,
  meId,
  onReply,
}: Props & { onReply: (c: CommentDTO) => void }) {
  const t = useT();
  const { data, isLoading } = useComments(taskId);
  const users = useUserMap();
  const del = useDeleteComment(taskId);
  const pin = usePinComment(taskId);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {[0, 1].map((i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
    );
  }
  if (!data?.length) {
    return (
      <p className="py-4 text-center text-[0.9375rem] text-fg-3">
        {t.tasks.noComments}
      </p>
    );
  }

  const sorted = [...data].sort((a, b) => Number(b.pinned) - Number(a.pinned));

  return (
    <div className="flex flex-col gap-3">
      {sorted.map((c) => {
        const author = users.get(c.authorId);
        const mine = c.authorId === meId;
        return (
          <div key={c.id} className="flex animate-fade-up gap-2.5">
            <UserAvatar user={author} size={2} className="mt-1" />
            <div
              className={cn(
                "min-w-0 flex-1 rounded-2xl p-3",
                mine ? "bg-primary-soft" : "bg-surface",
                c.id.startsWith("tmp-") && "opacity-70",
              )}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-[0.875rem] font-semibold text-primary">
                  {author?.name}
                </span>
                <span className="shrink-0 text-[0.6875rem] text-fg-3">
                  {formatDateTime(c.createdAt)}
                </span>
              </div>
              {c.replyTo && (
                <div className="mt-1 border-l-2 border-primary/60 pl-2 text-[0.8125rem] text-fg-2">
                  <span className="font-medium">
                    {users.get(c.replyTo.authorId)?.name}:{" "}
                  </span>
                  <span className="line-clamp-1">{c.replyTo.text}</span>
                </div>
              )}
              <p className="selectable-desktop mt-1 whitespace-pre-wrap break-words text-[0.9375rem] leading-snug">
                {c.pinned && (
                  <Pin className="mr-1 inline size-3.5 rotate-45 text-primary" />
                )}
                <RichText text={c.text} />
              </p>
              <div className="mt-2 flex gap-4 text-[0.75rem] text-fg-2">
                <button
                  type="button"
                  onClick={() => onReply(c)}
                  className="inline-flex items-center gap-1 hover:text-primary"
                >
                  <Reply className="size-3.5" /> {t.tasks.reply}
                </button>
                <button
                  type="button"
                  onClick={() => pin.mutate({ id: c.id, pinned: !c.pinned })}
                  className="inline-flex items-center gap-1 hover:text-primary"
                >
                  {c.pinned ? (
                    <PinOff className="size-3.5" />
                  ) : (
                    <Pin className="size-3.5" />
                  )}
                  {c.pinned ? t.tasks.unpin : t.tasks.pin}
                </button>
                {mine && (
                  <button
                    type="button"
                    onClick={() => del.mutate(c.id)}
                    className="inline-flex items-center gap-1 text-danger"
                  >
                    <Trash2 className="size-3.5" /> {t.tasks.delete}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Поле комментария с @-упоминаниями */
export function TaskCommentComposer({
  taskId,
  meId,
  replyTo,
  onCancelReply,
  onSent,
}: Props & {
  onCancelReply: () => void;
  onSent?: () => void;
  replyTo: CommentDTO | null;
}) {
  const t = useT();
  const isDesktop = useIsDesktop();
  const [text, setText] = useState("");
  const [caret, setCaret] = useState(0);
  const input = useRef<HTMLTextAreaElement>(null);
  const add = useAddComment(taskId, meId);
  const { data: users } = useUsers();
  const userMap = useUserMap();

  // Ищем «@слово» прямо перед курсором
  const mention = useMemo(() => {
    const before = text.slice(0, caret);
    const m = /@([\p{L}\d_]*)$/u.exec(before);
    return m ? { query: m[1].toLowerCase(), start: m.index } : null;
  }, [text, caret]);

  const suggestions = useMemo(() => {
    if (!mention) return [];
    return (users ?? [])
      .filter(
        (u) => u.id !== meId && u.name.toLowerCase().includes(mention.query),
      )
      .slice(0, 5);
  }, [mention, users, meId]);

  const insertMention = (name: string) => {
    if (!mention) return;
    const tag = `@${firstName(name)} `;
    const next = text.slice(0, mention.start) + tag + text.slice(caret);
    setText(next);
    const pos = mention.start + tag.length;
    requestAnimationFrame(() => {
      input.current?.focus();
      input.current?.setSelectionRange(pos, pos);
      setCaret(pos);
    });
  };

  const send = () => {
    const v = text.trim();
    if (!v) return;
    add.mutate({ text: v, replyToId: replyTo?.id ?? null });
    haptic("light");
    setText("");
    onCancelReply();
    onSent?.();
  };

  return (
    <div className="relative shrink-0">
      {suggestions.length > 0 && (
        <div className="popover absolute bottom-full left-3 right-3 mb-2 overflow-hidden rounded-2xl border border-separator bg-elevated shadow-float">
          {suggestions.map((u) => (
            <button
              key={u.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => insertMention(u.name)}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-left active:bg-surface-2 pointer-fine:hover:bg-surface-2"
            >
              <UserAvatar user={u} size={1.75} />
              <span className="flex-1 truncate text-[0.9375rem]">{u.name}</span>
              <span className="text-[0.75rem] text-fg-3">
                @{firstName(u.name)}
              </span>
            </button>
          ))}
        </div>
      )}
      {replyTo && (
        <div className="glass flex animate-fade-in items-center gap-2 border-t border-separator px-4 py-2 text-[0.8125rem]">
          <Reply className="size-4 text-primary" />
          <span className="min-w-0 flex-1 truncate">
            <span className="font-semibold text-primary">
              {t.tasks.replyingTo(userMap.get(replyTo.authorId)?.name ?? "")}
            </span>{" "}
            <span className="text-fg-2">{replyTo.text}</span>
          </span>
          <button
            type="button"
            onClick={onCancelReply}
            className="p-1 text-fg-3"
          >
            <X className="size-4" />
          </button>
        </div>
      )}
      <div className="glass flex items-end gap-1.5 border-t border-separator px-2.5 pb-[max(0.6rem,env(safe-area-inset-bottom))] pt-2">
        <button
          type="button"
          onClick={() => {
            const pos = input.current?.selectionStart ?? text.length;
            const next = `${text.slice(0, pos)}@${text.slice(pos)}`;
            setText(next);
            requestAnimationFrame(() => {
              input.current?.focus();
              input.current?.setSelectionRange(pos + 1, pos + 1);
              setCaret(pos + 1);
            });
          }}
          className="pressable mb-1 flex size-9 items-center justify-center rounded-full text-primary"
          aria-label="mention"
        >
          <AtSign className="size-5" />
        </button>
        <button
          type="button"
          onClick={() => toast.show(t.common.soon)}
          className="pressable mb-1 flex size-9 items-center justify-center rounded-full text-primary"
          aria-label={t.tasks.attachFile}
        >
          <Paperclip className="size-5" />
        </button>
        <div className="flex min-h-11 flex-1 items-center rounded-[1.375rem] bg-surface-2 px-4">
          <AutoTextarea
            ref={input}
            value={text}
            maxRows={5}
            placeholder={t.tasks.commentPlaceholder}
            onChange={(e) => {
              setText(e.target.value);
              setCaret(e.target.selectionStart);
            }}
            onSelect={(e) =>
              setCaret((e.target as HTMLTextAreaElement).selectionStart)
            }
            onKeyDown={(e) => {
              if (
                suggestions.length &&
                (e.key === "Enter" || e.key === "Tab")
              ) {
                e.preventDefault();
                insertMention(suggestions[0].name);
                return;
              }
              if (isDesktop && e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            className="w-full py-2.5 text-[1rem] leading-snug lg:text-[0.9375rem]"
          />
        </div>
        <button
          type="button"
          onClick={send}
          disabled={!text.trim()}
          aria-label="send"
          className="pressable mb-0.5 flex size-10 items-center justify-center rounded-full bg-primary text-white transition-opacity disabled:bg-surface-3 disabled:text-fg-3"
        >
          <ArrowUp className="size-5" strokeWidth={2.6} />
        </button>
      </div>
    </div>
  );
}
