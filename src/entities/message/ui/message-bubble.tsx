import { Fragment, type ReactNode, useMemo, useRef, useState } from "react";

import {
  CalendarDays,
  Check,
  CheckCheck,
  CircleDot,
  Clock3,
  FileText,
  MessageSquareText,
  Pause,
  Phone,
  Pin,
  Play,
  Sparkles,
  Video,
} from "lucide-react";

import type { TaskEvent } from "@/shared/api";
import {
  cn,
  formatDuration,
  formatFileSize,
  formatTime,
  useT,
} from "@/shared/lib";

import type { UiMessage } from "../api/queries";
import { PlaceholderArt } from "./placeholder-art";

type Props = {
  animate?: boolean;
  authorColor?: string;
  authorName?: string;
  highlighted?: boolean;
  message: UiMessage;
  mine: boolean;
  onFileClick?: (message: UiMessage) => void;
  onOpenMedia?: (message: UiMessage) => void;
  onOpenTask?: (taskId: string) => void;
  onReplyClick?: (messageId: string) => void;
  replyAuthorName?: string;
  showAuthor?: boolean;
  /** Последнее в серии — у пузыря «хвостик» */
  tail?: boolean;
};

/* ── Текст: ссылки и @упоминания ───────────────────────────────────────── */

const TOKEN_RE = /(https?:\/\/[^\s]+|@[\p{L}\d_]+)/gu;

export function RichText({ text, mine }: { mine?: boolean; text: string }) {
  const parts = text.split(TOKEN_RE);
  return (
    <>
      {parts.map((p, i) => {
        if (/^https?:\/\//.test(p)) {
          return (
            <a
              key={i}
              href={p}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "break-all underline decoration-1 underline-offset-2",
                mine ? "text-[#2f7d3a] dark:text-[#9fe0a9]" : "text-blue",
              )}
            >
              {p}
            </a>
          );
        }
        if (p.startsWith("@")) {
          return (
            <span key={i} className="font-medium text-primary">
              {p}
            </span>
          );
        }
        return <Fragment key={i}>{p}</Fragment>;
      })}
    </>
  );
}

/* ── Время и галочки ───────────────────────────────────────────────────── */

function Meta({
  message,
  mine,
  overlay,
}: {
  message: UiMessage;
  mine: boolean;
  overlay?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex select-none items-center gap-0.5 whitespace-nowrap text-[0.6875rem] leading-none",
        overlay
          ? "rounded-full bg-black/45 px-1.5 py-1 text-white backdrop-blur-sm"
          : mine
            ? "text-bubble-out-meta"
            : "text-fg-3",
      )}
    >
      {message.pinned && <Pin className="mr-0.5 size-3 rotate-45" />}
      {formatTime(message.createdAt)}
      {mine &&
        (message.pending ? (
          <Clock3 className="ml-0.5 size-3.5 animate-spin-slow" />
        ) : message.status === "read" ? (
          <CheckCheck className="ml-0.5 size-3.5" strokeWidth={2.4} />
        ) : (
          <Check className="ml-0.5 size-3.5" strokeWidth={2.4} />
        ))}
    </span>
  );
}

/* ── Цитата ответа ─────────────────────────────────────────────────────── */

function ReplyQuote({
  name,
  text,
  onClick,
  mine,
}: {
  mine: boolean;
  name: string;
  onClick?: () => void;
  text: string;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className={cn(
        "mb-1 flex w-full min-w-0 flex-col rounded-lg border-l-[3px] border-primary py-1 pl-2 pr-2 text-left transition-colors",
        mine ? "bg-black/[0.05] dark:bg-white/[0.06]" : "bg-primary-soft/70",
      )}
    >
      <span className="truncate text-[0.8125rem] font-semibold text-primary">
        {name}
      </span>
      <span className="line-clamp-1 text-[0.8125rem] text-fg-2">{text}</span>
    </button>
  );
}

/* ── Событие задачи (канал Daily) ──────────────────────────────────────── */

const EVENT_ICON: Record<
  TaskEvent["icon"],
  { color: string; icon: ReactNode }
> = {
  calendar: { icon: <CalendarDays />, color: "#fc8400" },
  comment: { icon: <MessageSquareText />, color: "#3c7efc" },
  status: { icon: <CircleDot />, color: "#06ae72" },
  created: { icon: <Sparkles />, color: "#fc246c" },
};

/* ── Голосовое ─────────────────────────────────────────────────────────── */

function VoicePlayer({ message, mine }: { message: UiMessage; mine: boolean }) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const bars = useMemo(() => {
    let seed = 0;
    for (const ch of message.id) seed = (seed * 33 + ch.charCodeAt(0)) % 9973;
    return Array.from(
      { length: 28 },
      (_, i) => 0.25 + (((seed * (i + 3)) % 97) / 97) * 0.75,
    );
  }, [message.id]);
  const duration = message.attachment?.durationSec ?? 0;

  const toggle = () => {
    const url = message.attachment?.url;
    if (!url) return;
    if (!audio.current) {
      audio.current = new Audio(url);
      audio.current.ontimeupdate = () => {
        const a = audio.current!;
        setProgress(a.duration ? a.currentTime / a.duration : 0);
      };
      audio.current.onended = () => {
        setPlaying(false);
        setProgress(0);
      };
    }
    if (playing) audio.current.pause();
    else void audio.current.play();
    setPlaying(!playing);
  };

  return (
    <div className="flex items-center gap-2.5 py-0.5 pr-1">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          toggle();
        }}
        className={cn(
          "pressable flex size-10 shrink-0 items-center justify-center rounded-full text-white",
          mine ? "bg-[#4fae5b]" : "bg-primary",
        )}
      >
        {playing ? (
          <Pause className="size-5" fill="currentColor" />
        ) : (
          <Play className="ml-0.5 size-5" fill="currentColor" />
        )}
      </button>
      <div className="flex flex-col gap-1">
        <div className="flex h-6 items-center gap-[2px]">
          {bars.map((h, i) => (
            <span
              key={i}
              className={cn(
                "w-[3px] rounded-full transition-colors",
                i / bars.length < progress
                  ? mine
                    ? "bg-[#4fae5b]"
                    : "bg-primary"
                  : mine
                    ? "bg-[#4fae5b]/35"
                    : "bg-fg-3/45",
              )}
              style={{ height: `${h * 100}%` }}
            />
          ))}
        </div>
        <span
          className={cn(
            "text-[0.6875rem]",
            mine ? "text-bubble-out-meta" : "text-fg-3",
          )}
        >
          {formatDuration(duration)}
        </span>
      </div>
    </div>
  );
}

/* ── Пузырь ────────────────────────────────────────────────────────────── */

export function MessageBubble({
  message: m,
  mine,
  authorName,
  authorColor,
  showAuthor,
  tail,
  replyAuthorName,
  onReplyClick,
  onOpenTask,
  onOpenMedia,
  onFileClick,
  highlighted,
  animate,
}: Props) {
  const t = useT();
  const isMedia = (m.kind === "image" || m.kind === "video") && m.attachment;

  const bubbleBase = cn(
    "relative max-w-full rounded-[1.15rem] shadow-[0_1px_1px_rgb(0_0_0/0.06)] transition-[box-shadow,background-color] duration-500",
    mine ? "bg-bubble-out" : "bg-bubble-in",
    tail && (mine ? "rounded-br-[0.4rem]" : "rounded-bl-[0.4rem]"),
    highlighted && "ring-4 ring-primary/35",
  );

  const author = showAuthor && !mine && authorName && (
    <div
      className="mb-0.5 truncate text-[0.8125rem] font-semibold"
      style={{ color: authorColor }}
    >
      {authorName}
    </div>
  );

  const reply = m.replyTo && (
    <ReplyQuote
      mine={mine}
      name={replyAuthorName ?? ""}
      text={m.replyTo.text || t.chats.attachment}
      onClick={() => onReplyClick?.(m.replyTo!.id)}
    />
  );

  let body: ReactNode;

  if (isMedia) {
    const a = m.attachment!;
    const ratio = Math.min(
      1.5,
      Math.max(0.62, (a.width ?? 4) / (a.height ?? 3)),
    );
    const isVideo = m.kind === "video";
    body = (
      <div className={cn(bubbleBase, "overflow-hidden p-[3px]")}>
        {(author || reply) && (
          <div className="px-2 pt-1">
            {author}
            {reply}
          </div>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenMedia?.(m);
          }}
          className="relative block w-[min(17.5rem,68vw)] overflow-hidden rounded-[0.95rem] lg:w-[19rem]"
          style={{ aspectRatio: isVideo ? "16 / 10" : `${ratio}` }}
        >
          {a.url && !isVideo ? (
            <img
              src={a.url}
              alt={a.name}
              className="size-full object-cover"
              draggable={false}
            />
          ) : (
            <PlaceholderArt
              kind={a.placeholder ?? (isVideo ? "video" : "screenshot")}
            />
          )}
          {isVideo && (
            <>
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="flex size-12 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md transition-transform active:scale-90">
                  <Play className="ml-0.5 size-6" fill="currentColor" />
                </span>
              </span>
              {a.durationSec != null && (
                <span className="absolute left-2 top-2 rounded-full bg-black/45 px-2 py-0.5 text-[0.6875rem] text-white backdrop-blur-sm">
                  {formatDuration(a.durationSec)}
                </span>
              )}
              <span className="absolute bottom-2 left-2 max-w-[62%] truncate text-[0.6875rem] text-white/85">
                {a.name}
              </span>
            </>
          )}
          {!m.text && (
            <span className="absolute bottom-1.5 right-1.5">
              <Meta message={m} mine={mine} overlay />
            </span>
          )}
        </button>
        {m.text && (
          <p className="relative px-2.5 pb-1.5 pt-1 text-[1rem] leading-[1.35] lg:text-[0.9375rem]">
            <RichText text={m.text} mine={mine} />
            <span
              className={cn("inline-block", mine ? "w-[4.2rem]" : "w-[2.9rem]")}
            />
            <span className="absolute bottom-1.5 right-2.5">
              <Meta message={m} mine={mine} />
            </span>
          </p>
        )}
      </div>
    );
  } else if (m.kind === "file" && m.attachment) {
    body = (
      <div className={cn(bubbleBase, "px-2.5 py-2")}>
        {author}
        {reply}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onFileClick?.(m);
          }}
          className="flex min-w-[12rem] max-w-[16rem] items-center gap-2.5 rounded-xl bg-black/[0.035] p-2 pr-3 text-left dark:bg-white/[0.05]"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <FileText className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[0.9375rem] font-medium">
              {m.attachment.name}
            </span>
            <span className="block text-[0.75rem] text-fg-2">
              {formatFileSize(m.attachment.size)}
            </span>
          </span>
        </button>
        <div className="mt-1 flex justify-end">
          <Meta message={m} mine={mine} />
        </div>
      </div>
    );
  } else if (m.kind === "call" && m.call) {
    body = (
      <div
        className={cn(bubbleBase, "flex items-center gap-2.5 py-2 pl-2.5 pr-3")}
      >
        <span
          className={cn(
            "flex size-9 items-center justify-center rounded-full",
            mine
              ? "bg-[#4fae5b]/15 text-[#3c9a49]"
              : "bg-primary-soft text-primary",
          )}
        >
          {m.call.video ? (
            <Video className="size-[1.1rem]" />
          ) : (
            <Phone className="size-[1.1rem]" />
          )}
        </span>
        <span className="text-[1rem] font-medium lg:text-[0.9375rem]">
          {t.chats.call} · {formatDuration(m.call.durationSec)}
        </span>
        <span className="ml-1 self-end">
          <Meta message={m} mine={mine} />
        </span>
      </div>
    );
  } else if (m.kind === "voice") {
    body = (
      <div className={cn(bubbleBase, "px-2 py-1.5")}>
        {author}
        <div className="flex items-end gap-2">
          <VoicePlayer message={m} mine={mine} />
          <Meta message={m} mine={mine} />
        </div>
      </div>
    );
  } else if (m.kind === "task_event" && m.taskEvent) {
    const ev = m.taskEvent;
    const meta = EVENT_ICON[ev.icon];
    body = (
      <div
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation();
          onOpenTask?.(ev.taskId);
        }}
        className={cn(
          bubbleBase,
          "cursor-pointer px-3 py-2 transition-transform active:scale-[0.985]",
        )}
      >
        {author}
        <p className="relative text-[1rem] leading-[1.35] lg:text-[0.9375rem]">
          <span
            className="mr-1.5 inline-flex size-[1.15rem] translate-y-[3px] items-center justify-center [&_svg]:size-[1.05rem]"
            style={{ color: meta.color }}
          >
            {meta.icon}
          </span>
          <span className="font-semibold">{ev.title}</span>
          {ev.icon === "calendar" ? " " : ": "}
          <RichText text={ev.text} mine={mine} />
          <span
            className={cn("inline-block", mine ? "w-[4.2rem]" : "w-[2.9rem]")}
          />
          <span className="absolute bottom-0 right-0">
            <Meta message={m} mine={mine} />
          </span>
        </p>
      </div>
    );
  } else {
    body = (
      <div className={cn(bubbleBase, "px-3 py-[0.4rem]")}>
        {author}
        {reply}
        <p className="selectable-desktop relative whitespace-pre-wrap break-words text-[1rem] leading-[1.35] lg:text-[0.9375rem]">
          <RichText text={m.text} mine={mine} />
          <span
            className={cn("inline-block", mine ? "w-[4.2rem]" : "w-[2.9rem]")}
          />
          <span className="absolute bottom-0 right-0 translate-y-[1px]">
            <Meta message={m} mine={mine} />
          </span>
        </p>
      </div>
    );
  }

  return (
    <div className={cn("min-w-0", animate && "animate-message-in")}>{body}</div>
  );
}

/** Разделитель дней: «пилюля» по центру ленты */
export function DayDivider({ label }: { label: string }) {
  return (
    <div className="sticky -top-2 z-[5] flex justify-center py-1.5">
      <span className="rounded-full bg-black/[0.12] px-2.5 py-0.5 text-[0.8125rem] font-medium text-white backdrop-blur-md dark:bg-white/10 dark:text-fg-2">
        {label}
      </span>
    </div>
  );
}
