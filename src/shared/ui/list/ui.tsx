import type { ReactNode } from "react";

import { ChevronRight } from "lucide-react";

import { cn } from "../../lib/cn";

/** Группа ячеек как в «Настройках» iOS: белая карточка, разделители с отступом */
export function ListGroup({
  children,
  header,
  footer,
  className,
}: {
  children: ReactNode;
  className?: string;
  footer?: ReactNode;
  header?: ReactNode;
}) {
  return (
    <section className={cn("mx-4", className)}>
      {header && (
        <div className="px-4 pb-1.5 text-[0.8125rem] font-medium uppercase tracking-wide text-fg-2">
          {header}
        </div>
      )}
      <div className="divide-y divide-separator overflow-hidden rounded-2xl bg-surface [&>*]:border-separator">
        {children}
      </div>
      {footer && (
        <div className="px-4 pt-1.5 text-[0.8125rem] leading-snug text-fg-2">
          {footer}
        </div>
      )}
    </section>
  );
}

type RowProps = {
  chevron?: boolean;
  className?: string;
  danger?: boolean;
  /** Иконка в цветной плитке слева */
  icon?: ReactNode;
  iconColor?: string;
  /** Произвольный элемент слева вместо плитки (аватар) */
  leading?: ReactNode;
  onClick?: () => void;
  selected?: boolean;
  subtitle?: ReactNode;
  title: ReactNode;
  trailing?: ReactNode;
  value?: ReactNode;
};

export function ListRow({
  title,
  subtitle,
  icon,
  iconColor = "#8e8e93",
  leading,
  value,
  trailing,
  chevron,
  onClick,
  danger,
  className,
  selected,
}: RowProps) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "flex min-h-[3.25rem] w-full items-center gap-3 px-4 py-2 text-left transition-colors",
        onClick && "active:bg-surface-2 pointer-fine:hover:bg-surface-2/70",
        selected && "bg-primary-soft",
        className,
      )}
    >
      {icon && (
        <span
          className="flex size-[1.875rem] shrink-0 items-center justify-center rounded-lg text-white [&_svg]:size-[1.125rem]"
          style={{ background: iconColor }}
        >
          {icon}
        </span>
      )}
      {leading}
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "block truncate text-[1.0625rem] lg:text-[0.975rem]",
            danger && "text-danger",
          )}
        >
          {title}
        </span>
        {subtitle && (
          <span className="block truncate text-[0.8125rem] text-fg-2">
            {subtitle}
          </span>
        )}
      </span>
      {value !== undefined && (
        <span className="shrink-0 truncate text-[1rem] text-fg-2 lg:text-[0.9375rem]">
          {value}
        </span>
      )}
      {trailing}
      {chevron && (
        <ChevronRight className="size-5 shrink-0 text-fg-3" strokeWidth={2.2} />
      )}
    </Comp>
  );
}
