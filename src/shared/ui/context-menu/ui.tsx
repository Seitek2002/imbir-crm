import {
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import { cn } from "../../lib/cn";
import { haptic } from "../../lib/haptics";
import { useIsDesktop, useLastDefined, usePresence } from "../../lib/hooks";

export type MenuItem = {
  danger?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  label: string;
  onSelect: () => void;
};

export type MenuAnchor = { x: number; y: number };

type Props = {
  anchor: MenuAnchor | null;
  /** Дополнительный ряд над пунктами (например, быстрые реакции) */
  header?: ReactNode;
  items: MenuItem[];
  onClose: () => void;
  /** Превью элемента над меню (как у сообщений в iOS) */
  preview?: ReactNode;
};

/**
 * Контекстное меню. Открывается по долгому тапу или правому клику и
 * «вырастает» из точки нажатия. На телефоне фон затемняется и размывается.
 */
export function ContextMenu({
  anchor,
  onClose,
  items,
  preview,
  header,
}: Props) {
  const isDesktop = useIsDesktop();
  const { mounted, state } = usePresence(Boolean(anchor), 160);
  // Пока меню закрывается, держим последнюю точку, чтобы оно не «прыгало»
  const last = useLastDefined(anchor);
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{
    left: number;
    origin: string;
    top: number;
  } | null>(null);

  useLayoutEffect(() => {
    if (!mounted || !ref.current || !last) return;
    const { x, y } = last;
    const rect = ref.current.getBoundingClientRect();
    const pad = 12;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const left = Math.min(
      Math.max(pad, isDesktop ? x : x - rect.width / 2),
      vw - rect.width - pad,
    );
    const flipUp = y + rect.height + pad > vh;
    const top = flipUp ? Math.max(pad, y - rect.height) : y;
    setPos({
      left,
      top,
      origin: `${Math.round(x - left)}px ${flipUp ? "100%" : "0"}`,
    });
  }, [mounted, isDesktop, last]);

  useEffect(() => {
    if (!anchor) return;
    haptic("medium");
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const onScroll = () => onClose();
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onScroll);
    };
  }, [anchor, onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[120]"
      onContextMenu={(e) => e.preventDefault()}
    >
      <div
        className={cn(
          "modal-overlay absolute inset-0",
          isDesktop ? "bg-transparent" : "bg-black/25 backdrop-blur-md",
        )}
        data-state={state}
        onClick={onClose}
        onPointerDown={(e) => {
          if (isDesktop && e.button === 2) onClose();
        }}
      />
      <div
        ref={ref}
        className="popover absolute flex w-max min-w-[13.5rem] max-w-[min(20rem,calc(100vw-24px))] flex-col gap-2"
        data-state={state}
        style={{
          left: pos?.left ?? -9999,
          top: pos?.top ?? -9999,
          transformOrigin: pos?.origin ?? "50% 0",
        }}
      >
        {preview && !isDesktop && (
          <div className="pointer-events-none">{preview}</div>
        )}
        <div className="overflow-hidden rounded-[0.875rem] border border-glass-border bg-elevated/95 shadow-float backdrop-blur-xl lg:rounded-xl lg:p-1">
          {header}
          {items.map((it, i) => (
            <button
              key={i}
              type="button"
              disabled={it.disabled}
              onClick={() => {
                onClose();
                window.setTimeout(it.onSelect, 40);
              }}
              className={cn(
                "flex h-11 w-full items-center justify-between gap-6 px-4 text-left text-[1.0625rem] transition-colors active:bg-surface-2 disabled:opacity-40 pointer-fine:hover:bg-surface-2",
                "lg:h-9 lg:rounded-lg lg:px-3 lg:text-[0.875rem]",
                i > 0 && "border-t border-separator lg:border-0",
                it.danger ? "text-danger" : "text-fg",
              )}
            >
              <span>{it.label}</span>
              {it.icon && (
                <span className="opacity-80 [&_svg]:size-5 lg:[&_svg]:size-4">
                  {it.icon}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}
