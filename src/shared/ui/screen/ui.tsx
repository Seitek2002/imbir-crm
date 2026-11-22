import { type ReactNode, forwardRef } from "react";

import { ChevronLeft } from "lucide-react";

import { cn } from "../../lib/cn";
import { useScrollRestore } from "../../lib/hooks";
import { useT } from "../../lib/i18n";
import { useBack } from "./use-back";

/* ── Экран ─────────────────────────────────────────────────────────────── */

type ScreenProps = {
  children: ReactNode;
  className?: string;
  /** grouped — серый фон с карточками (iOS), plain — белый, chat — фон переписки */
  tone?: "chat" | "grouped" | "plain";
};

export function Screen({ children, className, tone = "grouped" }: ScreenProps) {
  return (
    <div
      className={cn(
        "relative flex h-full min-h-0 w-full flex-col overflow-hidden",
        tone === "grouped" && "bg-bg",
        tone === "plain" && "bg-surface",
        tone === "chat" && "bg-chat",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ── Навбар ────────────────────────────────────────────────────────────── */

type NavBarProps = {
  className?: string;
  left?: ReactNode;
  onTitleClick?: () => void;
  /** Заголовок в «пилюле» по центру (как в шапке чата) */
  pill?: boolean;
  right?: ReactNode;
  subtitle?: ReactNode;
  title?: ReactNode;
  /** glass — полупрозрачный поверх контента, solid — цвет экрана */
  variant?: "glass" | "solid" | "transparent";
};

export function NavBar({
  title,
  subtitle,
  left,
  right,
  variant = "solid",
  className,
  pill,
  onTitleClick,
}: NavBarProps) {
  const TitleTag = onTitleClick ? "button" : "div";
  return (
    <header
      className={cn(
        "relative z-20 shrink-0 pt-safe",
        variant === "glass" && "glass border-b border-separator",
        variant === "solid" && "bg-bg",
        className,
      )}
    >
      <div className="relative flex h-[3.375rem] items-center justify-between gap-2 px-3 lg:h-14 lg:px-4">
        <div className="z-10 flex min-w-0 items-center gap-1">{left}</div>
        {title !== undefined && (
          <TitleTag
            type={onTitleClick ? "button" : undefined}
            onClick={onTitleClick}
            className={cn(
              "absolute left-1/2 top-1/2 flex max-w-[58%] -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center",
              pill &&
                "glass rounded-full border border-glass-border px-5 py-1 shadow-soft transition-transform active:scale-[0.97]",
            )}
          >
            <span className="max-w-full truncate text-[1.0625rem] font-semibold leading-tight">
              {title}
            </span>
            {subtitle && (
              <span className="max-w-full truncate text-[0.75rem] leading-tight text-fg-2">
                {subtitle}
              </span>
            )}
          </TitleTag>
        )}
        <div className="z-10 flex min-w-0 items-center justify-end gap-1">
          {right}
        </div>
      </div>
    </header>
  );
}

export function BackButton({
  fallback,
  className,
}: {
  className?: string;
  fallback: string;
}) {
  const back = useBack(fallback);
  const t = useT();
  return (
    <button
      type="button"
      onClick={back}
      aria-label={t.common.back}
      className={cn(
        "pressable glass inline-flex size-10 items-center justify-center rounded-full border border-glass-border text-primary shadow-soft",
        className,
      )}
    >
      <ChevronLeft className="size-6" strokeWidth={2.4} />
    </button>
  );
}

/** Текстовая «пилюля» в шапке: «Изм.», «Готово» */
export function NavPillButton({
  children,
  onClick,
  className,
  active,
}: {
  active?: boolean;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "pressable h-9 rounded-full px-4 text-[0.9375rem] font-medium shadow-soft transition-colors",
        active ? "bg-primary text-white" : "bg-surface text-fg",
        className,
      )}
    >
      {children}
    </button>
  );
}

/* ── Скролл ────────────────────────────────────────────────────────────── */

type ScrollProps = {
  children: ReactNode;
  className?: string;
  /** Ключ для восстановления позиции при возврате на экран */
  restoreKey?: string;
};

export const ScrollArea = forwardRef<HTMLDivElement, ScrollProps>(
  function ScrollArea({ children, className, restoreKey }, forwarded) {
    const restoreRef = useScrollRestore<HTMLDivElement>(
      restoreKey ?? "__none__",
    );
    return (
      <div
        ref={(el) => {
          if (restoreKey) restoreRef.current = el;
          if (typeof forwarded === "function") forwarded(el);
          else if (forwarded) forwarded.current = el;
        }}
        className={cn("scroll-area min-h-0 flex-1", className)}
      >
        {children}
      </div>
    );
  },
);

/* ── Заголовок секции списка ───────────────────────────────────────────── */

export function SectionLabel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "px-4 pb-1.5 pt-5 text-[0.8125rem] font-medium uppercase tracking-wide text-fg-2",
        className,
      )}
    >
      {children}
    </div>
  );
}
