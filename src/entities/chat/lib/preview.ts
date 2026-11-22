import type { MessageDTO } from "@/shared/api";
import type { Dict } from "@/shared/lib";

/** Короткий текст сообщения для списка чатов и уведомлений */
export function messagePreview(
  m: Pick<MessageDTO, "attachment" | "call" | "kind" | "taskEvent" | "text">,
  t: Dict,
) {
  switch (m.kind) {
    case "image":
      return m.text || t.chats.photo;
    case "video":
      return m.text || m.attachment?.name || t.chats.video;
    case "file":
      return m.attachment?.name ?? t.chats.file;
    case "voice":
      return t.chats.voice;
    case "call":
      return t.chats.call;
    case "task_event":
      return m.taskEvent ? `${m.taskEvent.title}: ${m.taskEvent.text}` : "";
    default:
      return m.text;
  }
}
