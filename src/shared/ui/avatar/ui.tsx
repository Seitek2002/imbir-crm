import { UsersRound } from "lucide-react";

import type { AvatarSpec } from "../../api/types";
import { cn } from "../../lib/cn";
import { Logo } from "../logo/ui";
import { getInitials } from "./lib";

type Props = {
  className?: string;
  name: string;
  online?: boolean;
  /** Кольцо статуса: непросмотренный — розовый градиент, просмотренный — серое */
  ring?: "none" | "seen" | "unseen";
  showInitials?: boolean;
  /** Диаметр в rem */
  size?: number;
  spec: AvatarSpec;
};

export function Avatar({
  spec,
  name,
  size = 2.75,
  online,
  ring = "none",
  showInitials,
  className,
}: Props) {
  const px = `${size}rem`;
  const inner = (() => {
    if (
      showInitials &&
      spec.kind !== "brand" &&
      spec.kind !== "group" &&
      spec.kind !== "color"
    ) {
      return (
        <span
          className="flex size-full items-center justify-center rounded-full bg-primary font-semibold text-white"
          style={{ fontSize: `${size * 0.38}rem` }}
        >
          {getInitials(name)}
        </span>
      );
    }
    switch (spec.kind) {
      case "image":
        return (
          <img
            src={spec.src}
            alt=""
            className="size-full rounded-full object-cover"
            draggable={false}
          />
        );
      case "emoji":
        return (
          <span
            className="flex size-full items-center justify-center rounded-full"
            style={{
              background: spec.bg ?? "var(--surface-2)",
              fontSize: `${size * 0.52}rem`,
            }}
          >
            <span className="leading-none">{spec.emoji}</span>
          </span>
        );
      case "initials":
        return (
          <span
            className="flex size-full items-center justify-center rounded-full font-semibold text-white"
            style={{ background: spec.color, fontSize: `${size * 0.38}rem` }}
          >
            {getInitials(name)}
          </span>
        );
      case "brand":
        return <Logo size={size} round />;
      case "group":
        return (
          <span
            className="flex size-full items-center justify-center rounded-full"
            style={{
              background: spec.color
                ? `color-mix(in srgb, ${spec.color} 16%, var(--surface))`
                : "var(--primary-soft)",
              color: spec.color ?? "var(--color-primary)",
            }}
          >
            <UsersRound
              style={{
                width: `${size * 0.42}rem`,
                height: `${size * 0.42}rem`,
              }}
              strokeWidth={2.4}
            />
          </span>
        );
      case "color":
        return (
          <span
            className="block size-full rounded-full"
            style={{ background: spec.color }}
          />
        );
    }
  })();

  return (
    <span
      className={cn("relative inline-flex shrink-0", className)}
      style={{ width: px, height: px }}
    >
      {ring !== "none" ? (
        <span
          className={cn(
            "flex size-full items-center justify-center rounded-full p-[2px]",
            ring === "unseen"
              ? "bg-[conic-gradient(from_200deg,#fc246c,#fc8400,#fc246c,#6c42fc,#fc246c)]"
              : "bg-surface-3",
          )}
        >
          <span className="flex size-full rounded-full bg-surface p-[2px]">
            {inner}
          </span>
        </span>
      ) : (
        inner
      )}
      {online !== undefined && (
        <span
          className={cn(
            "absolute bottom-[4%] right-[4%] rounded-full border-2 border-surface",
            online ? "bg-success" : "bg-fg-3",
          )}
          style={{
            width: `${Math.max(0.6, size * 0.24)}rem`,
            height: `${Math.max(0.6, size * 0.24)}rem`,
          }}
        />
      )}
    </span>
  );
}

type StackProps = {
  items: { id: string; name: string; spec: AvatarSpec }[];
  max?: number;
  size?: number;
};

export function AvatarStack({ items, max = 3, size = 1.5 }: StackProps) {
  const shown = items.slice(0, max);
  const rest = items.length - shown.length;
  return (
    <span className="inline-flex items-center">
      {shown.map((it, i) => (
        <span
          key={it.id}
          className="rounded-full ring-2 ring-surface"
          style={{
            marginLeft: i ? `-${size * 0.32}rem` : 0,
            zIndex: shown.length - i,
          }}
        >
          <Avatar spec={it.spec} name={it.name} size={size} />
        </span>
      ))}
      {rest > 0 && (
        <span className="ml-1.5 text-xs font-medium text-fg-2">+{rest}</span>
      )}
    </span>
  );
}
