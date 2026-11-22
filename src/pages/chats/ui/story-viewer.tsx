import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";

import { Eye, Send, Trash2, X } from "lucide-react";

import { useCreateChat, useDrafts } from "@/entities/chat";
import { UserAvatar, useUserMap } from "@/entities/user";

import type { StoryDTO } from "@/shared/api";
import { formatRelative, usePresence, useT } from "@/shared/lib";
import { toast } from "@/shared/model";

import { useDeleteStory, useMarkStorySeen } from "../api/stories";
import { STORY_BACKGROUNDS } from "../config/story-backgrounds";

const DURATION = 5000;

type Props = {
  meId: string;
  onClose: () => void;
  startIndex: null | number;
  stories: StoryDTO[];
};

/** Просмотр статусов как в Telegram/Instagram: прогресс-бары, тапы, удержание — пауза */
export function StoryViewer({ stories, startIndex, meId, onClose }: Props) {
  const t = useT();
  const navigate = useNavigate();
  const users = useUserMap();
  const open = startIndex !== null;
  const { mounted, state } = usePresence(open, 220);
  const [index, setIndex] = useState(startIndex ?? 0);
  const [paused, setPaused] = useState(false);
  const [reply, setReply] = useState("");
  const markSeen = useMarkStorySeen();
  const del = useDeleteStory();
  const createChat = useCreateChat();
  const setDraft = useDrafts((s) => s.setDraft);
  const timer = useRef<null | number>(null);
  const startY = useRef<null | number>(null);
  const [dy, setDy] = useState(0);
  const [prevStart, setPrevStart] = useState(startIndex);

  // Открыли на другом статусе — начинаем с него
  if (startIndex !== prevStart) {
    setPrevStart(startIndex);
    if (startIndex !== null) {
      setIndex(startIndex);
      setDy(0);
    }
  }

  const story = stories[index];

  const next = useCallback(() => {
    if (index < stories.length - 1) setIndex((i) => i + 1);
    else onClose();
  }, [index, stories.length, onClose]);

  const prev = () => setIndex((i) => Math.max(0, i - 1));

  useEffect(() => {
    if (!open || !story) return;
    if (!story.seen && story.userId !== meId) markSeen.mutate(story.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, story?.id]);

  useEffect(() => {
    if (!open || paused || !story) return;
    timer.current = window.setTimeout(next, DURATION);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [open, paused, story, next]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, next, onClose]);

  if (!mounted || !story) return null;
  const author = users.get(story.userId);
  const mine = story.userId === meId;

  const sendReply = () => {
    const text = reply.trim();
    if (!text) return;
    createChat.mutate(
      { kind: "direct", memberIds: [story.userId] },
      {
        onSuccess: (chat) => {
          setDraft(chat.id, `«${story.text}» — ${text}`);
          setReply("");
          onClose();
          navigate(`/chats/${chat.id}`);
        },
      },
    );
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[140] flex items-center justify-center bg-black/90"
      role="dialog"
    >
      <div
        className="modal-overlay absolute inset-0 bg-black"
        data-state={state}
        onClick={onClose}
      />
      <div
        className="modal-panel relative flex h-full w-full flex-col overflow-hidden lg:h-[min(52rem,92vh)] lg:w-[min(28rem,92vw)] lg:rounded-3xl"
        data-state={state}
        style={{
          background: STORY_BACKGROUNDS[story.bg] ?? STORY_BACKGROUNDS.sunset,
          transform: dy
            ? `translateY(${dy}px) scale(${1 - Math.min(0.15, dy / 2000)})`
            : undefined,
          borderRadius: dy ? 24 : undefined,
        }}
      >
        {/* Прогресс */}
        <div className="flex gap-1 px-2.5 pt-[max(0.6rem,env(safe-area-inset-top))]">
          {stories.map((s, i) => (
            <div
              key={s.id}
              className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/35"
            >
              <div
                key={`${s.id}-${index}`}
                className="h-full origin-left rounded-full bg-white"
                style={
                  i < index
                    ? { transform: "scaleX(1)" }
                    : i === index
                      ? {
                          animation: `story-progress ${DURATION}ms linear forwards`,
                          animationPlayState: paused ? "paused" : "running",
                        }
                      : { transform: "scaleX(0)" }
                }
              />
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 px-3 pt-3 text-white">
          <UserAvatar user={author} size={2.5} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[0.9375rem] font-semibold">
              {mine ? t.chats.myStatus : author?.name}
            </div>
            <div className="text-[0.75rem] text-white/75">
              {formatRelative(story.createdAt)}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="pressable flex size-10 items-center justify-center rounded-full bg-black/15"
            aria-label={t.common.close}
          >
            <X className="size-6" />
          </button>
        </div>

        {/* Тапы: левая треть — назад, остальное — вперёд; удержание — пауза */}
        <div
          className="relative flex flex-1 touch-none select-none items-center justify-center px-8"
          onPointerDown={(e) => {
            startY.current = e.clientY;
            setPaused(true);
          }}
          onPointerMove={(e) => {
            if (startY.current != null)
              setDy(Math.max(0, e.clientY - startY.current));
          }}
          onPointerUp={(e) => {
            const moved = dy;
            startY.current = null;
            setPaused(false);
            if (moved > 120) return onClose();
            setDy(0);
            if (moved > 10) return;
            const rect = (
              e.currentTarget as HTMLElement
            ).getBoundingClientRect();
            if (e.clientX - rect.left < rect.width / 3) prev();
            else next();
          }}
        >
          <div
            key={story.id}
            className="flex animate-[pop-in_380ms_var(--ease-spring)] flex-col items-center text-center text-white"
          >
            <span className="text-[5.5rem] leading-none drop-shadow-lg">
              {story.emoji}
            </span>
            <p className="mt-6 text-[1.75rem] font-bold leading-tight drop-shadow-md">
              {story.text}
            </p>
          </div>
        </div>

        <div className="px-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {mine ? (
            <div className="flex items-center justify-between text-white">
              <span className="inline-flex items-center gap-1.5 text-[0.9375rem]">
                <Eye className="size-5" /> {t.stories.viewed(story.viewsCount)}
              </span>
              <button
                type="button"
                onClick={() => {
                  del.mutate(story.id);
                  toast.show(t.stories.removed);
                  onClose();
                }}
                className="pressable inline-flex items-center gap-1.5 rounded-full bg-black/20 px-4 py-2 text-[0.9375rem] font-medium"
              >
                <Trash2 className="size-4" /> {t.stories.remove}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onFocus={() => setPaused(true)}
                onBlur={() => setPaused(false)}
                onKeyDown={(e) => e.key === "Enter" && sendReply()}
                placeholder={t.stories.reply}
                className="h-11 flex-1 rounded-full border border-white/40 bg-black/10 px-4 text-white outline-none placeholder:text-white/70"
              />
              <button
                type="button"
                onClick={sendReply}
                className="pressable flex size-11 items-center justify-center rounded-full bg-white text-primary"
                aria-label="send"
              >
                <Send className="size-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
