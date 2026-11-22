import { cn } from "../../lib/cn";
import { haptic } from "../../lib/haptics";

type Option<T extends string> = { label: string; value: T };

type Props<T extends string> = {
  /** Розовый текст активного сегмента, как в «Список / Календарь» */
  accent?: boolean;
  className?: string;
  onChange: (value: T) => void;
  options: Option<T>[];
  value: T;
};

/** Сегментированный контрол: подложка-«бегунок» скользит к выбранному пункту */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  className,
  accent = true,
}: Props<T>) {
  const index = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  return (
    <div
      role="tablist"
      className={cn(
        "relative flex rounded-xl bg-surface-3/70 p-[3px] dark:bg-surface-2",
        className,
      )}
    >
      <span
        aria-hidden
        className="absolute bottom-[3px] left-[3px] top-[3px] rounded-[0.6rem] bg-surface shadow-[0_3px_8px_rgb(0_0_0/0.08),0_1px_1px_rgb(0_0_0/0.04)] transition-transform duration-300 ease-[var(--ease-out-expo)] dark:bg-surface-3"
        style={{
          width: `calc((100% - 6px) / ${options.length})`,
          transform: `translateX(${index * 100}%)`,
        }}
      />
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => {
              if (!active) haptic("light");
              onChange(o.value);
            }}
            className={cn(
              "relative z-10 h-9 flex-1 rounded-[0.6rem] text-[0.9375rem] font-medium transition-colors duration-200",
              active
                ? accent
                  ? "font-semibold text-primary"
                  : "font-semibold text-fg"
                : "text-fg-2",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
