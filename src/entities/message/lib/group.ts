import { isSameDay } from "@/shared/lib";

import type { UiMessage } from "../api/queries";

export type RenderItem =
  | {
      /** Первое сообщение серии от одного автора — показываем имя */
      first: boolean;
      key: string;
      /** Последнее в серии — «хвостик» пузыря и аватар */
      last: boolean;
      message: UiMessage;
      type: "message";
    }
  | { date: string; key: string; type: "day" }
  | { key: string; type: "unread" };

const SERIES_GAP = 5 * 60_000;

/** Раскладывает ленту: разделители дней, линия «Новые сообщения», серии */
export function buildRenderItems(
  messages: UiMessage[],
  unreadAfter?: null | string,
  meId?: string,
): RenderItem[] {
  const items: RenderItem[] = [];
  let unreadInserted = false;
  messages.forEach((m, i) => {
    const prev = messages[i - 1];
    const next = messages[i + 1];
    if (!prev || !isSameDay(prev.createdAt, m.createdAt)) {
      items.push({
        type: "day",
        key: `d-${m.createdAt.slice(0, 10)}-${m.id}`,
        date: m.createdAt,
      });
    }
    if (
      !unreadInserted &&
      unreadAfter &&
      m.createdAt > unreadAfter &&
      m.authorId !== meId
    ) {
      items.push({ type: "unread", key: "unread" });
      unreadInserted = true;
    }
    const sameAsPrev =
      prev &&
      prev.authorId === m.authorId &&
      isSameDay(prev.createdAt, m.createdAt) &&
      new Date(m.createdAt).getTime() - new Date(prev.createdAt).getTime() <
        SERIES_GAP;
    const sameAsNext =
      next &&
      next.authorId === m.authorId &&
      isSameDay(next.createdAt, m.createdAt) &&
      new Date(next.createdAt).getTime() - new Date(m.createdAt).getTime() <
        SERIES_GAP;
    items.push({
      type: "message",
      key: m.clientId ?? m.id,
      message: m,
      first: !sameAsPrev,
      last: !sameAsNext,
    });
  });
  return items;
}
