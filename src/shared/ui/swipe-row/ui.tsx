import { type ReactNode, useEffect, useRef, useState } from "react";

import { cn } from "../../lib/cn";
import { haptic } from "../../lib/haptics";

export type SwipeAction = {
  color: string;
  icon: ReactNode;
  label: string;
  onAction: () => void;
};

type Props = {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  /** Действия слева — свайпом вправо */
  left?: SwipeAction[];
  /** Действия справа — открываются свайпом влево */
  right?: SwipeAction[];
};

const ACTION_W = 78;

// Открытой может быть только одна строка — как в Почте/Telegram
let closeOpenRow: (() => void) | null = null;

/** Строка списка со свайп-действиями (только тач; на десктопе — контекстное меню) */
export function SwipeRow({
  children,
  right = [],
  left = [],
  disabled,
  className,
}: Props) {
  const content = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const g = useRef<{
    axis: "x" | "y" | null;
    base: number;
    moved: boolean;
    x: number;
    y: number;
  } | null>(null);
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const suppressClick = useRef(false);
  const offsetRef = useRef(0);

  const apply = (x: number) => {
    offsetRef.current = x;
    setOffset(x);
  };

  const close = () => apply(0);

  useEffect(() => {
    if (offset !== 0) {
      if (closeOpenRow && closeOpenRow !== close) closeOpenRow();
      closeOpenRow = close;
    } else if (closeOpenRow === close) {
      closeOpenRow = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offset !== 0]);

  const maxRight = right.length * ACTION_W;
  const maxLeft = left.length * ACTION_W;

  const onPointerDown = (e: React.PointerEvent) => {
    if (disabled || e.pointerType === "mouse") return;
    g.current = {
      x: e.clientX,
      y: e.clientY,
      base: offsetRef.current,
      axis: null,
      moved: false,
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const s = g.current;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (!s.axis) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      s.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      if (s.axis === "x") {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        setDragging(true);
      }
    }
    if (s.axis !== "x") return;
    s.moved = true;
    let next = s.base + dx;
    const width = root.current?.offsetWidth ?? 360;
    // Резиновое сопротивление за пределами панели действий
    if (next < -maxRight) next = -maxRight + (next + maxRight) * 0.35;
    if (next > maxLeft) next = maxLeft + (next - maxLeft) * 0.35;
    if (!maxRight && next < 0) next = 0;
    if (!maxLeft && next > 0) next = 0;
    apply(Math.max(-width, Math.min(width, next)));
  };

  const onPointerUp = () => {
    const s = g.current;
    g.current = null;
    setDragging(false);
    if (!s || s.axis !== "x") return;
    suppressClick.current = s.moved;
    const x = offsetRef.current;
    const width = root.current?.offsetWidth ?? 360;
    // Полный свайп — сразу выполняем первое действие
    if (x < -width * 0.55 && right[0]) {
      haptic("medium");
      apply(0);
      right[0].onAction();
      return;
    }
    if (x > width * 0.55 && left[0]) {
      haptic("medium");
      apply(0);
      left[0].onAction();
      return;
    }
    if (x < -maxRight / 2) apply(-maxRight);
    else if (x > maxLeft / 2) apply(maxLeft);
    else apply(0);
  };

  const renderActions = (actions: SwipeAction[], side: "left" | "right") => {
    const total = actions.length * ACTION_W;
    const reveal =
      side === "right" ? Math.max(0, -offset) : Math.max(0, offset);
    return (
      <div
        className={cn(
          "absolute inset-y-0 flex",
          side === "right" ? "right-0" : "left-0",
        )}
        style={{ width: Math.max(total, reveal) }}
      >
        {actions.map((a, i) => (
          <button
            key={a.label}
            type="button"
            onClick={() => {
              haptic("light");
              apply(0);
              a.onAction();
            }}
            className="flex flex-1 flex-col items-center justify-center gap-1 text-[0.75rem] font-medium text-white [&_svg]:size-6"
            style={{
              background: a.color,
              // Кнопки «выезжают» пропорционально свайпу
              transform: `translateX(${side === "right" ? (1 - Math.min(1, reveal / total)) * (actions.length - i) * 18 : -(1 - Math.min(1, reveal / total)) * (i + 1) * 18}px)`,
            }}
          >
            {a.icon}
            {a.label}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div ref={root} className={cn("relative overflow-hidden", className)}>
      {offset < 0 && renderActions(right, "right")}
      {offset > 0 && renderActions(left, "left")}
      <div
        ref={content}
        className={cn(
          "relative bg-inherit",
          !dragging && "transition-transform duration-300 ease-out-expo",
        )}
        style={{ transform: `translateX(${offset}px)`, touchAction: "pan-y" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClickCapture={(e) => {
          if (suppressClick.current || offsetRef.current !== 0) {
            e.preventDefault();
            e.stopPropagation();
            suppressClick.current = false;
            if (offsetRef.current !== 0) apply(0);
          }
        }}
      >
        {children}
      </div>
    </div>
  );
}
