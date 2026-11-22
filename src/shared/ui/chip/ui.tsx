import type { ReactNode } from "react";

import { X } from "lucide-react";

import { cn } from "../../lib/cn";

type Props = {
  children: ReactNode;
  className?: string;
  /** Цвет текста; фон — тот же цвет на 12% */
  color?: string;
  icon?: ReactNode;
  onClick?: () => void;
};

export function Chip({ children, color, className, icon, onClick }: Props) {
  const Comp = onClick ? "button" : "span";
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "inline-flex h-6 items-center gap-1 whitespace-nowrap rounded-md px-2 text-[0.75rem] font-semibold",
        onClick && "pressable",
        className,
      )}
      style={
        color
          ? {
              color,
              background: `color-mix(in srgb, ${color} 13%, transparent)`,
            }
          : undefined
      }
    >
      {icon}
      {children}
    </Comp>
  );
}

type TagProps = { className?: string; label: string; onRemove?: () => void };

export function TagChip({ label, onRemove, className }: TagProps) {
  return (
    <span
      className={cn(
        "inline-flex h-7 animate-pop-in items-center gap-1 rounded-full bg-primary-soft pl-3 text-[0.8125rem] font-semibold text-primary",
        onRemove ? "pr-1.5" : "pr-3",
        className,
      )}
    >
      #{label}
      {onRemove && (
        <button
          type="button"
          aria-label="remove"
          onClick={onRemove}
          className="pressable inline-flex size-5 items-center justify-center rounded-full hover:bg-primary/10"
        >
          <X className="size-3.5" strokeWidth={2.6} />
        </button>
      )}
    </span>
  );
}
