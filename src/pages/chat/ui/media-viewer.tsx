import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { Download, Play, X } from "lucide-react";

import { PlaceholderArt, type UiMessage } from "@/entities/message";

import {
  cn,
  formatDateTime,
  useLastDefined,
  usePresence,
  useT,
} from "@/shared/lib";
import { toast } from "@/shared/model";

type Props = {
  authorName?: string;
  message: null | UiMessage;
  onClose: () => void;
};

/** Полноэкранный просмотр фото/видео: появление с масштабом, свайп вниз — закрыть */
export function MediaViewer({ message, authorName, onClose }: Props) {
  const t = useT();
  const { mounted, state } = usePresence(Boolean(message), 220);
  // Во время анимации закрытия показываем последнее открытое фото
  const m = useLastDefined(message);
  const [dy, setDy] = useState(0);
  const [dragStart, setDragStart] = useState<null | number>(null);
  const [prevMessage, setPrevMessage] = useState(message);

  if (message !== prevMessage) {
    setPrevMessage(message);
    setDy(0);
  }

  useEffect(() => {
    if (!message) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [message, onClose]);

  if (!mounted || !m?.attachment) return null;
  const a = m.attachment;
  const isVideo = m.kind === "video";

  return createPortal(
    <div className="fixed inset-0 z-[130] flex flex-col" role="dialog">
      <div
        className="modal-overlay absolute inset-0 bg-black"
        data-state={state}
        style={{
          opacity:
            state === "open"
              ? Math.max(0.35, 1 - Math.abs(dy) / 400)
              : undefined,
        }}
      />
      <div className="relative z-10 flex items-center gap-3 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] text-white">
        <button
          type="button"
          onClick={onClose}
          className="pressable flex size-10 items-center justify-center rounded-full bg-white/10"
          aria-label={t.common.close}
        >
          <X className="size-6" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[0.9375rem] font-semibold">
            {authorName}
          </div>
          <div className="text-[0.75rem] text-white/60">
            {formatDateTime(m.createdAt)}
          </div>
        </div>
        {a.url && !isVideo && (
          <a
            href={a.url}
            download={a.name}
            className="pressable flex size-10 items-center justify-center rounded-full bg-white/10"
            aria-label="download"
          >
            <Download className="size-5" />
          </a>
        )}
      </div>
      <div
        className="relative flex flex-1 touch-none items-center justify-center p-4"
        onClick={onClose}
        onPointerDown={(e) => setDragStart(e.clientY)}
        onPointerMove={(e) => dragStart != null && setDy(e.clientY - dragStart)}
        onPointerUp={() => {
          if (Math.abs(dy) > 120) onClose();
          else setDy(0);
          setDragStart(null);
        }}
      >
        <div
          className={cn(
            "modal-panel max-h-full w-full max-w-3xl",
            dragStart == null && "transition-transform duration-300",
          )}
          data-state={state}
          style={{
            transform: dy
              ? `translateY(${dy}px) scale(${1 - Math.min(0.2, Math.abs(dy) / 1500)})`
              : undefined,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {a.url && !isVideo ? (
            <img
              src={a.url}
              alt={a.name}
              className="mx-auto max-h-[80vh] rounded-lg object-contain"
              draggable={false}
            />
          ) : (
            <div
              className="relative mx-auto w-full overflow-hidden rounded-xl"
              style={{
                aspectRatio: isVideo
                  ? "16 / 10"
                  : `${(a.width ?? 4) / (a.height ?? 3)}`,
                maxHeight: "80vh",
              }}
            >
              <PlaceholderArt
                kind={a.placeholder ?? (isVideo ? "video" : "screenshot")}
              />
              {isVideo && (
                <button
                  type="button"
                  onClick={() => toast.show(t.chats.callUnavailable)}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <span className="flex size-16 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md">
                    <Play className="ml-1 size-8" fill="currentColor" />
                  </span>
                </button>
              )}
            </div>
          )}
          <p className="mt-3 truncate text-center text-[0.8125rem] text-white/70">
            {m.text || a.name}
          </p>
        </div>
      </div>
    </div>,
    document.body,
  );
}
