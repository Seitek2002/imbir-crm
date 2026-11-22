import { useChats } from "@/entities/chat";
import { useUnreadNotificationsCount } from "@/entities/notification";

import type { NavKey } from "../config/nav";

/** Счётчики для вкладок: непрочитанные чаты и уведомления */
export function useNavBadges(): Partial<Record<NavKey, number>> {
  const { data: chats } = useChats();
  const notifications = useUnreadNotificationsCount();
  const unreadChats = (chats ?? []).filter(
    (c) => c.unreadCount > 0 && !c.muted && !c.archived,
  ).length;
  return { chats: unreadChats, notifications };
}
