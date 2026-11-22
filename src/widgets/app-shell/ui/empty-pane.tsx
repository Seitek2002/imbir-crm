import type { ReactNode } from "react";

import { Kbd, MOD_KEY } from "@/shared/ui";

type Props = {
  action?: ReactNode;
  hint?: string;
  icon: ReactNode;
  text: string;
  title: string;
};

/** Правая панель десктопа, когда ничего не выбрано */
export function EmptyPane({ icon, title, text, hint, action }: Props) {
  return (
    <div className="relative flex h-full flex-col items-center justify-center overflow-hidden bg-chat px-10 text-center">
      <div
        className="pointer-events-none absolute inset-0 opacity-40 dark:opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 15% 25%, rgb(255 255 255 / 0.7) 0 1.5px, transparent 2.5px), radial-gradient(circle at 65% 70%, rgb(255 255 255 / 0.7) 0 1.5px, transparent 2.5px)",
          backgroundSize: "44px 44px, 60px 60px",
        }}
      />
      <div className="relative flex animate-fade-up flex-col items-center">
        <div className="mb-5 flex size-20 items-center justify-center rounded-[1.75rem] bg-surface/80 text-primary shadow-soft backdrop-blur [&_svg]:size-9">
          {icon}
        </div>
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="mt-1.5 max-w-sm text-[0.9375rem] text-fg-2">{text}</p>
        {action && <div className="mt-5">{action}</div>}
        {hint && (
          <p className="mt-8 inline-flex items-center gap-1.5 rounded-full bg-surface/70 px-3 py-1.5 text-[0.8125rem] text-fg-2 backdrop-blur">
            <Kbd>{MOD_KEY}</Kbd>
            <Kbd>K</Kbd>
            {hint}
          </p>
        )}
      </div>
    </div>
  );
}
