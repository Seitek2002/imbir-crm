import { type ButtonHTMLAttributes, forwardRef } from "react";

import { cn } from "../../lib/cn";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  size?: "lg" | "md" | "sm";
  variant?: "danger" | "glass" | "plain" | "solid" | "tinted";
};

const VARIANTS = {
  glass: "glass border border-glass-border text-primary shadow-soft",
  plain: "text-primary pointer-fine:hover:bg-surface-2",
  tinted: "bg-primary-soft text-primary",
  solid: "bg-primary text-white shadow-[0_6px_14px_-6px_rgb(252_36_108/0.6)]",
  danger: "text-danger pointer-fine:hover:bg-danger/10",
};

const SIZES = { sm: "size-8", md: "size-10", lg: "size-11" };

/** Круглая кнопка-иконка. label — для скринридеров и подсказки на десктопе */
export const IconButton = forwardRef<HTMLButtonElement, Props>(
  function IconButton(
    { variant = "plain", size = "md", label, className, children, ...rest },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type="button"
        aria-label={label}
        title={label}
        className={cn(
          "pressable inline-flex shrink-0 items-center justify-center rounded-full transition-colors disabled:opacity-40 [&_svg]:size-[1.35rem]",
          VARIANTS[variant],
          SIZES[size],
          className,
        )}
        {...rest}
      >
        {children}
      </button>
    );
  },
);
