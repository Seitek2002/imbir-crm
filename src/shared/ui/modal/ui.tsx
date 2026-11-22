import { type ReactNode, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

import { X } from "lucide-react";

import { cn } from "../../lib/cn";
import { useIsDesktop, usePresence } from "../../lib/hooks";

type Props = {
  /** Без собственного фона: содержимое рисует свои карточки (action sheet) */
  bare?: boolean;
  bodyClassName?: string;
  /** Всегда центрированная панель, даже на телефоне (короткие диалоги) */
  centered?: boolean;
  children: ReactNode;
  /** Слоты шапки (например «Отмена» / «Готово» как в iOS) */
  headerLeft?: ReactNode;
  headerRight?: ReactNode;
  hideHeader?: boolean;
  /** Запретить закрытие (идёт запрос) */
  locked?: boolean;
  onClose: () => void;
  open: boolean;
  panelClassName?: string;
  /** sm — диалог, md — форма, lg — большой контент, full — почти на весь экран */
  size?: "full" | "lg" | "md" | "sm";
  title?: ReactNode;
};

const DURATION = 200;
const DESKTOP_WIDTH = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-2xl",
  full: "max-w-3xl",
};

/**
 * Модалка: на телефоне — bottom-sheet со свайпом вниз, на десктопе — панель по центру.
 * Анимации — как в imbir-nextjs: @starting-style на появление, data-state="closed"
 * на закрытие (см. .modal-* в styles/index.css).
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  headerLeft,
  headerRight,
  hideHeader,
  size = "md",
  bare,
  panelClassName,
  bodyClassName,
  locked,
  centered,
}: Props) {
  const isDesktop = useIsDesktop();
  const { mounted, state } = usePresence(open, DURATION);
  const sheetRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ dy: number; startY: number; t: number } | null>(null);

  const close = useCallback(() => {
    if (!locked) onClose();
  }, [locked, onClose]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        close();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  if (!mounted) return null;

  const asSheet = !isDesktop && !centered;

  /* ── Свайп вниз для закрытия шторки ──────────────────────────────────── */
  const onPointerDown = (e: React.PointerEvent) => {
    if (!asSheet || locked) return;
    drag.current = { startY: e.clientY, dy: 0, t: performance.now() };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    const el = sheetRef.current;
    if (!d || !el) return;
    d.dy = Math.max(0, e.clientY - d.startY);
    el.dataset.dragging = "true";
    el.style.setProperty("--drag-y", `${d.dy}px`);
  };
  const onPointerUp = () => {
    const d = drag.current;
    const el = sheetRef.current;
    drag.current = null;
    if (!d || !el) return;
    el.dataset.dragging = "false";
    const velocity = d.dy / Math.max(1, performance.now() - d.t);
    if (d.dy > 110 || velocity > 0.7) {
      close();
      // Продолжаем движение вниз с текущей позиции
      requestAnimationFrame(() => el.style.setProperty("--drag-y", "0px"));
    } else {
      el.style.setProperty("--drag-y", "0px");
    }
  };

  const header = !hideHeader && (title || headerLeft || headerRight) && (
    <div
      className={cn(
        "relative flex min-h-14 shrink-0 items-center justify-between gap-3 px-4",
        asSheet && "touch-none",
      )}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div className="flex min-w-16 justify-start">
        {headerLeft ?? (
          <button
            type="button"
            onClick={close}
            aria-label="close"
            className="pressable inline-flex size-8 items-center justify-center rounded-full bg-surface-2 text-fg-2"
          >
            <X className="size-4.5" strokeWidth={2.4} />
          </button>
        )}
      </div>
      <h2 className="absolute left-1/2 max-w-[60%] -translate-x-1/2 truncate text-center text-[1.0625rem] font-semibold">
        {title}
      </h2>
      <div className="flex min-w-16 justify-end">{headerRight}</div>
    </div>
  );

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-[100] flex justify-center",
        asSheet ? "items-end" : "items-center p-6",
      )}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="modal-overlay absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        data-state={state}
        onClick={close}
      />
      {asSheet ? (
        <div
          ref={sheetRef}
          className={cn(
            "modal-sheet relative flex w-full flex-col overflow-hidden pb-safe",
            bare
              ? "bg-transparent px-2 pb-2"
              : "rounded-t-[1.25rem] bg-elevated shadow-float",
            size === "full"
              ? "h-[calc(var(--app-height,100dvh)-env(safe-area-inset-top)-0.75rem)]"
              : "max-h-[92%]",
            panelClassName,
          )}
          data-state={state}
        >
          {!bare && (
            <div
              className="flex h-5 shrink-0 touch-none items-center justify-center"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              <span className="h-[5px] w-9 rounded-full bg-fg-3/50" />
            </div>
          )}
          {header}
          <div
            className={cn(
              "scroll-area min-h-0 flex-1",
              !bare && "px-4 pb-4",
              bodyClassName,
            )}
          >
            {children}
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "modal-panel relative flex max-h-[min(88vh,52rem)] w-full flex-col overflow-hidden",
            bare
              ? "bg-transparent"
              : "rounded-[1.25rem] bg-elevated shadow-float",
            DESKTOP_WIDTH[size],
            size === "full" && "h-[88vh]",
            panelClassName,
          )}
          data-state={state}
        >
          {header}
          <div
            className={cn(
              "scroll-area min-h-0 flex-1",
              !bare && "px-5 pb-5",
              bodyClassName,
            )}
          >
            {children}
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
}
