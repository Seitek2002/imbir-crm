import { type ButtonHTMLAttributes, type ReactNode, forwardRef } from "react";

import { cn } from "../../lib/cn";
import { Spinner } from "../spinner/ui";

type Variant =
  "danger" | "ghost" | "outline" | "primary" | "secondary" | "tinted";
type Size = "lg" | "md" | "sm";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  block?: boolean;
  icon?: ReactNode;
  loading?: boolean;
  size?: Size;
  variant?: Variant;
};

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-primary text-white shadow-[0_6px_16px_-6px_rgb(252_36_108/0.55)] pointer-fine:hover:bg-primary-press disabled:bg-primary/45 disabled:shadow-none",
  secondary: "bg-surface text-fg shadow-soft pointer-fine:hover:bg-surface-2",
  tinted: "bg-primary-soft text-primary pointer-fine:hover:brightness-95",
  ghost: "bg-transparent text-fg-2 pointer-fine:hover:bg-surface-2",
  danger: "bg-danger text-white pointer-fine:hover:brightness-95",
  outline:
    "border border-separator bg-transparent text-fg-2 pointer-fine:hover:bg-surface-2",
};

const SIZES: Record<Size, string> = {
  lg: "h-[3.25rem] rounded-2xl px-6 text-[1.0625rem] font-semibold",
  md: "h-11 rounded-xl px-5 text-[0.9375rem] font-semibold",
  sm: "h-8 rounded-full px-3.5 text-[0.8125rem] font-semibold",
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  {
    variant = "primary",
    size = "lg",
    loading,
    block,
    icon,
    className,
    children,
    disabled,
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      disabled={disabled || loading}
      className={cn(
        "pressable relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap transition-colors disabled:cursor-not-allowed",
        VARIANTS[variant],
        SIZES[size],
        block && "w-full",
        className,
      )}
      {...rest}
    >
      <span
        className={cn("inline-flex items-center gap-2", loading && "opacity-0")}
      >
        {icon}
        {children}
      </span>
      {loading && <Spinner className="absolute size-5" />}
    </button>
  );
});
