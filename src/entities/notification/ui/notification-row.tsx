import type { HTMLAttributes } from "react";

import {
  AtSign,
  CircleCheck,
  ListTodo,
  MessageCircle,
  MessageSquareText,
  Newspaper,
} from "lucide-react";

import type { NotificationDTO, NotificationKind } from "@/shared/api";
import { cn, formatRelative } from "@/shared/lib";

const ICON: Record<NotificationKind, { color: string; icon: React.ReactNode }> =
  {
    message: { icon: <MessageCircle />, color: "var(--fg-2)" },
    mention: { icon: <AtSign />, color: "#fc246c" },
    task: { icon: <ListTodo />, color: "#3c7efc" },
    comment: { icon: <MessageSquareText />, color: "#18baba" },
    digest: { icon: <CircleCheck />, color: "#06ae72" },
  };

type Props = HTMLAttributes<HTMLDivElement> & {
  active?: boolean;
  item: NotificationDTO;
};

export function NotificationRow({ item, active, className, ...rest }: Props) {
  const meta =
    item.kind === "digest"
      ? { icon: <Newspaper />, color: "#06ae72" }
      : ICON[item.kind];
  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        "relative flex cursor-default gap-3.5 px-4 py-3 transition-colors active:bg-surface-2 pointer-fine:hover:bg-surface-2/70",
        active && "bg-primary-soft",
        className,
      )}
      {...rest}
    >
      <span
        className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-2 [&_svg]:size-5"
        style={{ color: meta.color }}
      >
        {meta.icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[1rem] font-semibold">
            {item.title}
          </span>
          {!item.read && (
            <span className="size-2 shrink-0 animate-pop-in rounded-full bg-primary" />
          )}
        </div>
        <p className="line-clamp-2 text-[0.9375rem] leading-snug text-fg-2">
          {item.body}
        </p>
        <span className="mt-0.5 block text-[0.75rem] text-fg-3">
          {formatRelative(item.createdAt)}
        </span>
      </div>
    </div>
  );
}
