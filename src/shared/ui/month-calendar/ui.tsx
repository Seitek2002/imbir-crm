import { useMemo, useRef, useState } from "react";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "../../lib/cn";
import { formatMonthYear, isSameDay, toDateKey } from "../../lib/format";
import { haptic } from "../../lib/haptics";
import { useT } from "../../lib/i18n";

type Props = {
  /** Подпись под заголовком месяца */
  caption?: string;
  className?: string;
  compact?: boolean;
  /** dateKey → цвета точек-меток под числом */
  marks?: Record<string, string[]>;
  month: Date;
  onMonthChange: (d: Date) => void;
  onSelect: (d: Date) => void;
  selected?: Date | null;
  todayLabel?: string;
};

function buildGrid(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const shift = (first.getDay() + 6) % 7; // неделя с понедельника
  const start = new Date(first);
  start.setDate(first.getDate() - shift);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

/** Месячный календарь: свайп влево/вправо листает месяцы, точки — задачи на день */
export function MonthCalendar({
  month,
  onMonthChange,
  selected,
  onSelect,
  marks = {},
  caption,
  todayLabel,
  className,
  compact,
}: Props) {
  const t = useT();
  const days = useMemo(() => buildGrid(month), [month]);
  const [dir, setDir] = useState<"l" | "r" | null>(null);
  const touch = useRef<null | number>(null);
  const today = new Date();

  const go = (delta: number) => {
    haptic("light");
    setDir(delta > 0 ? "l" : "r");
    onMonthChange(new Date(month.getFullYear(), month.getMonth() + delta, 1));
  };

  // Убираем пустую последнюю неделю, если она целиком из следующего месяца
  const visible = days.slice(35).every((d) => d.getMonth() !== month.getMonth())
    ? days.slice(0, 35)
    : days;

  return (
    <div className={cn("select-none", className)}>
      <div className="flex items-center gap-2 px-1 pb-3">
        <button
          type="button"
          onClick={() => go(-1)}
          className="pressable inline-flex size-9 items-center justify-center rounded-full bg-surface-2 text-fg-2"
          aria-label="prev"
        >
          <ChevronLeft className="size-5" />
        </button>
        <div className="flex-1 text-center">
          <div className="text-[1.125rem] font-bold">
            {formatMonthYear(month)}
          </div>
          {caption && <div className="text-xs text-fg-2">{caption}</div>}
        </div>
        <button
          type="button"
          onClick={() => go(1)}
          className="pressable inline-flex size-9 items-center justify-center rounded-full bg-surface-2 text-fg-2"
          aria-label="next"
        >
          <ChevronRight className="size-5" />
        </button>
        {todayLabel && (
          <button
            type="button"
            onClick={() => {
              onMonthChange(new Date(today.getFullYear(), today.getMonth(), 1));
              onSelect(today);
            }}
            className="pressable h-8 rounded-full bg-primary-soft px-3 text-[0.8125rem] font-semibold text-primary"
          >
            {todayLabel}
          </button>
        )}
      </div>

      <div className="grid grid-cols-7 pb-1 text-center text-[0.75rem] font-medium text-fg-3">
        {t.tasks.weekdays.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>

      <div
        key={month.toISOString()}
        className={cn(
          "grid grid-cols-7",
          dir === "l" && "animate-[cal-in-l_260ms_var(--ease-out-expo)]",
          dir === "r" && "animate-[cal-in-r_260ms_var(--ease-out-expo)]",
        )}
        onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touch.current == null) return;
          const dx = e.changedTouches[0].clientX - touch.current;
          touch.current = null;
          if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
        }}
      >
        {visible.map((d) => {
          const inMonth = d.getMonth() === month.getMonth();
          const isToday = isSameDay(d, today);
          const isSel = selected ? isSameDay(d, selected) : false;
          const dots = marks[toDateKey(d)] ?? [];
          return (
            <button
              key={d.toISOString()}
              type="button"
              onClick={() => {
                haptic("light");
                onSelect(d);
              }}
              className={cn(
                "flex flex-col items-center justify-start",
                compact ? "h-11" : "h-[3.25rem]",
              )}
            >
              <span
                className={cn(
                  "flex size-9 items-center justify-center rounded-full text-[1rem] transition-all duration-200",
                  !inMonth && "text-fg-3/60",
                  inMonth && "text-fg",
                  isToday && !isSel && "font-bold text-primary",
                  isSel &&
                    "scale-105 bg-primary font-semibold text-white shadow-[0_6px_14px_-6px_rgb(252_36_108/0.7)]",
                  !isSel &&
                    "active:bg-surface-2 pointer-fine:hover:bg-surface-2",
                )}
              >
                {d.getDate()}
              </span>
              <span className="mt-0.5 flex h-1.5 gap-0.5">
                {dots.slice(0, 3).map((c, i) => (
                  <span
                    key={i}
                    className="size-1.5 rounded-full"
                    style={{ background: c }}
                  />
                ))}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
