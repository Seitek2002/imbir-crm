import type { HTMLAttributes } from "react";

import {
  BellOff,
  Check,
  CheckCheck,
  ImageIcon,
  MessageSquareText,
  Mic,
  Paperclip,
  Phone,
  Pin,
  Video,
} from "lucide-react";

import type { ChatDTO } from "@/shared/api";
import { cn, formatChatDate, useT } from "@/shared/lib";
import { Avatar, CountBadge } from "@/shared/ui";

import { messagePreview } from "../lib/preview";

type Props = HTMLAttributes<HTMLDivElement> & {
  /** Открыт в правой панели (десктоп) */
  active?: boolean;
  chat: ChatDTO;
  checked?: boolean;
  draft?: string;
  /** Режим «Изм.»: показываем чекбокс */
  editMode?: boolean;
  meId: string;
  online?: boolean;
  typingLabel?: null | string;
};

export function TypingDots({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-[3px]", className)}>
      <span className="typing-dot size-[5px] rounded-full bg-current" />
      <span className="typing-dot size-[5px] rounded-full bg-current" />
      <span className="typing-dot size-[5px] rounded-full bg-current" />
    </span>
  );
}

function PreviewIcon({ kind }: { kind: string }) {
  const cls = "mr-1 inline size-[1.05rem] -translate-y-px text-fg-3";
  if (kind === "image") return <ImageIcon className={cls} />;
  if (kind === "file") return <Paperclip className={cls} />;
  if (kind === "voice") return <Mic className={cls} />;
  if (kind === "video") return <Video className={cls} />;
  if (kind === "call") return <Phone className={cls} />;
  if (kind === "task_event") return <MessageSquareText className={cls} />;
  return null;
}

export function ChatRow({
  chat,
  meId,
  online,
  typingLabel,
  draft,
  active,
  editMode,
  checked,
  className,
  ...rest
}: Props) {
  const t = useT();
  const last = chat.lastMessage;
  const mine = last?.authorId === meId;

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        "group relative flex cursor-default items-center gap-3 pl-4 transition-colors duration-150",
        chat.pinned ? "bg-surface-2/70 dark:bg-surface-2/40" : "bg-surface",
        "active:bg-surface-3/70 pointer-fine:hover:bg-surface-2",
        active && "bg-primary-soft! pointer-fine:hover:bg-primary-soft",
        className,
      )}
      {...rest}
    >
      {/* Чекбокс режима редактирования выезжает слева */}
      <span
        className={cn(
          "flex shrink-0 items-center justify-center overflow-hidden transition-all duration-300 ease-out-expo",
          editMode ? "-mr-0.5 w-7 opacity-100" : "-mr-3 w-0 opacity-0",
        )}
      >
        <span
          className={cn(
            "flex size-[1.4rem] items-center justify-center rounded-full border-[1.5px] transition-all duration-200",
            checked
              ? "scale-100 border-primary bg-primary text-white"
              : "border-fg-3",
          )}
        >
          {checked && (
            <Check className="size-3.5 animate-pop-in" strokeWidth={3.2} />
          )}
        </span>
      </span>

      <Avatar
        spec={chat.avatar}
        name={chat.title}
        size={3.25}
        online={chat.kind === "direct" ? online : undefined}
      />

      <div className="flex min-w-0 flex-1 flex-col justify-center border-b border-separator py-2.5 pr-4 group-last:border-transparent">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-[1.0625rem] font-semibold leading-snug lg:text-[1rem]">
            {chat.title}
          </span>
          {chat.muted && <BellOff className="size-3.5 shrink-0 text-fg-3" />}
          <span className="ml-auto flex shrink-0 items-center gap-1 pl-2 text-[0.875rem] text-fg-2">
            {last && mine && last.kind !== "task_event" ? (
              last.status === "read" ? (
                <CheckCheck className="size-4 text-success" strokeWidth={2.4} />
              ) : (
                <Check className="size-4 text-success" strokeWidth={2.4} />
              )
            ) : null}
            {last && mine && last.kind === "task_event" && (
              <Check className="size-4 text-success" strokeWidth={2.4} />
            )}
            {last && formatChatDate(last.createdAt)}
          </span>
        </div>
        <div className="flex items-start gap-2">
          <p className="line-clamp-2 min-h-[2.6em] flex-1 text-[0.9375rem] leading-[1.3] text-fg-2 lg:text-[0.875rem]">
            {typingLabel ? (
              <span className="inline-flex items-center gap-1.5 text-primary">
                {typingLabel}
                <TypingDots />
              </span>
            ) : draft ? (
              <>
                <span className="text-danger">{t.chats.draft}: </span>
                {draft}
              </>
            ) : last ? (
              <>
                <PreviewIcon kind={last.kind} />
                {messagePreview(last, t)}
              </>
            ) : null}
          </p>
          <span className="mt-0.5 flex shrink-0 items-center gap-1">
            {chat.unreadCount > 0 ? (
              <CountBadge count={chat.unreadCount} muted={chat.muted} />
            ) : (
              chat.pinned && <Pin className="size-4 rotate-45 text-fg-3" />
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
