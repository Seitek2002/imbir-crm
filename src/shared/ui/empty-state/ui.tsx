import type { ReactNode } from "react";

import { cn } from "../../lib/cn";

type Props = {
  action?: ReactNode;
  className?: string;
  icon: ReactNode;
  text?: string;
  title: string;
};

export function EmptyState({ icon, title, text, action, className }: Props) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-8 py-12 text-center",
        className,
      )}
    >
      <div className="relative mb-5 flex size-20 animate-pop-in items-center justify-center rounded-[1.75rem] bg-primary-soft text-primary [&_svg]:size-9">
        <span className="absolute inset-0 -z-10 scale-125 rounded-full bg-primary/10 blur-xl" />
        {icon}
      </div>
      <h3 className="animate-fade-up text-lg font-semibold [animation-delay:60ms]">
        {title}
      </h3>
      {text && (
        <p className="mt-1.5 max-w-xs animate-fade-up text-[0.9375rem] leading-snug text-fg-2 [animation-delay:110ms]">
          {text}
        </p>
      )}
      {action && (
        <div className="mt-5 animate-fade-up [animation-delay:160ms]">
          {action}
        </div>
      )}
    </div>
  );
}
