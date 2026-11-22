import type { User } from "@/shared/api";
import { Avatar } from "@/shared/ui";

type Props = {
  className?: string;
  ring?: "none" | "seen" | "unseen";
  size?: number;
  user: Pick<User, "avatar" | "name" | "presence" | "showInitials"> | undefined;
  withPresence?: boolean;
};

export function UserAvatar({
  user,
  size,
  withPresence,
  ring,
  className,
}: Props) {
  if (!user) {
    return (
      <Avatar
        spec={{ kind: "color", color: "var(--surface-3)" }}
        name=""
        size={size}
        className={className}
      />
    );
  }
  return (
    <Avatar
      spec={user.avatar}
      name={user.name}
      size={size}
      ring={ring}
      showInitials={user.showInitials}
      online={withPresence ? user.presence === "online" : undefined}
      className={className}
    />
  );
}
