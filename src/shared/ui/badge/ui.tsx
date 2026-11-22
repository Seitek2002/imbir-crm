import { useEffect, useRef, useState } from "react";

import { cn } from "../../lib/cn";

type Props = {
  className?: string;
  count: number;
  max?: number;
  muted?: boolean;
};

/** Счётчик непрочитанного. При изменении числа слегка «подпрыгивает» */
export function CountBadge({ count, muted, className, max = 99 }: Props) {
  const [bump, setBump] = useState(false);
  const prev = useRef(count);

  useEffect(() => {
    if (count > prev.current) {
      setBump(true);
      const t = window.setTimeout(() => setBump(false), 400);
      prev.current = count;
      return () => window.clearTimeout(t);
    }
    prev.current = count;
  }, [count]);

  if (count <= 0) return null;
  return (
    <span
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[0.75rem] font-semibold leading-none text-white animate-pop-in",
        muted ? "bg-fg-3" : "bg-primary",
        bump && "badge-bump",
        className,
      )}
    >
      {count > max ? `${max}+` : count}
    </span>
  );
}

export function Dot({ className }: { className?: string }) {
  return (
    <span
      className={cn("inline-block size-2.5 rounded-full bg-primary", className)}
    />
  );
}
