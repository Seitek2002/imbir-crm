import { cn } from "../../lib/cn";
import { haptic } from "../../lib/haptics";

type Props = {
  checked: boolean;
  className?: string;
  disabled?: boolean;
  label?: string;
  onChange: (value: boolean) => void;
};

/** Переключатель iOS: ручка «перетекает» с пружиной, трек заливается цветом */
export function Toggle({
  checked,
  onChange,
  disabled,
  label,
  className,
}: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        haptic("light");
        onChange(!checked);
      }}
      className={cn(
        "group relative h-[1.9375rem] w-[3.1875rem] shrink-0 rounded-full transition-colors duration-300 disabled:opacity-50",
        checked ? "bg-primary" : "bg-surface-3",
        className,
      )}
    >
      <span
        className={cn(
          "absolute left-[2px] top-[2px] h-[1.6875rem] w-[1.6875rem] rounded-full bg-white shadow-[0_3px_8px_rgb(0_0_0/0.15),0_1px_1px_rgb(0_0_0/0.16)]",
          "transition-[transform,width] duration-300 ease-[var(--ease-spring)] group-active:w-[2rem]",
          checked && "translate-x-[1.25rem] group-active:translate-x-[0.95rem]",
        )}
      />
    </button>
  );
}
