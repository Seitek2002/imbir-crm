import { uid } from "../../lib/id";
import type {
  ChatDTO,
  CommentDTO,
  Me,
  MessageDTO,
  NotificationKind,
  TaskDTO,
  TaskEvent,
  User,
} from "../types";
import {
  type ChatRow,
  type ChatUserState,
  type CommentRow,
  type DB,
  type MessageRow,
  type TaskRow,
  type UserRow,
  getDb,
} from "./db";

/* Доменные операции мок-бэкенда, общие для HTTP-обработчиков и «ботов». */

export const nowIso = () => new Date().toISOString();

export function findUser(db: DB, id: null | string | undefined) {
  return id ? db.users.find((u) => u.id === id) : undefined;
}

export function firstName(name: string) {
  return name.split(/[\s—-]/)[0];
}

export function toUser(u: UserRow): User {
  const { password: _p, mutedDepartmentIds: _m, ...rest } = u;
  return rest;
}

export function myTasks(db: DB, userId: string) {
  return db.tasks.filter((t) => isAssignee(db, t, userId));
}

export function isAssignee(db: DB, t: TaskRow, userId: string) {
  if (t.assigneeIds.includes(userId)) return true;
  if (t.assignAll && t.teamChatId) {
    return (
      db.chats.find((c) => c.id === t.teamChatId)?.memberIds.includes(userId) ??
      false
    );
  }
  return false;
}

export function toMe(db: DB, u: UserRow): Me {
  const mine = myTasks(db, u.id);
  return {
    ...toUser(u),
    mutedDepartmentIds: u.mutedDepartmentIds,
    stats: {
      open: mine.filter((t) => t.status !== "done").length,
      done: mine.filter((t) => t.status === "done").length,
    },
  };
}

/* ── Чаты ──────────────────────────────────────────────────────────────── */

export function chatState(
  db: DB,
  userId: string,
  chatId: string,
): ChatUserState {
  const byUser = (db.chatState[userId] ??= {});
  return (byUser[chatId] ??= {
    pinned: false,
    muted: false,
    archived: false,
    deleted: false,
    lastReadAt: db.seededAt,
  });
}

export function chatMessages(db: DB, chatId: string) {
  return db.messages.filter((m) => m.chatId === chatId && !m.deleted);
}

export function toMessage(db: DB, m: MessageRow, viewerId: string): MessageDTO {
  const chat = db.chats.find((c) => c.id === m.chatId);
  let status: MessageDTO["status"] = "sent";
  if (chat && m.authorId === viewerId) {
    const readers = chat.memberIds.filter((id) => id !== viewerId);
    if (
      readers.some((id) => chatState(db, id, chat.id).lastReadAt >= m.createdAt)
    )
      status = "read";
  }
  const reply = m.replyToId
    ? db.messages.find((x) => x.id === m.replyToId)
    : undefined;
  return {
    id: m.id,
    chatId: m.chatId,
    authorId: m.authorId,
    kind: m.kind,
    text: m.text,
    createdAt: m.createdAt,
    replyTo: reply
      ? {
          id: reply.id,
          authorId: reply.authorId,
          kind: reply.kind,
          text: reply.deleted ? "" : reply.text || reply.attachment?.name || "",
        }
      : null,
    attachment: m.attachment,
    call: m.call,
    taskEvent: m.taskEvent,
    status,
    pinned: m.pinned,
    clientId: m.clientId,
  };
}

export function toChat(db: DB, c: ChatRow, viewerId: string): ChatDTO {
  const state = chatState(db, viewerId, c.id);
  const list = chatMessages(db, c.id);
  const last = list[list.length - 1];
  const pinned = [...list].reverse().find((m) => m.pinned);
  const peerId =
    c.kind === "direct"
      ? (c.memberIds.find((id) => id !== viewerId) ?? null)
      : null;
  const peer = findUser(db, peerId);
  const unread = list.filter(
    (m) => m.authorId !== viewerId && m.createdAt > state.lastReadAt,
  ).length;
  return {
    id: c.id,
    kind: c.kind,
    title: peer ? peer.name : c.title,
    avatar: peer ? peer.avatar : c.avatar,
    handle: peer ? peer.handle : c.handle,
    memberIds: c.memberIds,
    membersCount: c.memberIds.length,
    peerId,
    readOnly: c.readOnly,
    pinned: state.pinned,
    muted: state.muted,
    archived: state.archived,
    unreadCount: unread,
    lastMessage: last ? toMessage(db, last, viewerId) : null,
    pinnedMessage: pinned ? toMessage(db, pinned, viewerId) : null,
    createdAt: c.createdAt,
    activityAt: last?.createdAt ?? c.createdAt,
  };
}

export function visibleChats(db: DB, viewerId: string) {
  return db.chats.filter(
    (c) =>
      c.memberIds.includes(viewerId) && !chatState(db, viewerId, c.id).deleted,
  );
}

export function sortChats(list: ChatDTO[]) {
  return list.sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.activityAt.localeCompare(a.activityAt);
  });
}

export function markChatRead(db: DB, userId: string, chatId: string) {
  chatState(db, userId, chatId).lastReadAt = nowIso();
  for (const n of db.notifications) {
    if (n.userId === userId && n.chatId === chatId) n.read = true;
  }
}

type NewMessage = Partial<MessageRow> & {
  authorId: null | string;
  chatId: string;
};

/** Добавляет сообщение и рассылает уведомления участникам */
export function insertMessage(db: DB, input: NewMessage): MessageRow {
  const row: MessageRow = {
    id: uid("m"),
    kind: "text",
    text: "",
    createdAt: nowIso(),
    replyToId: null,
    attachment: null,
    call: null,
    taskEvent: null,
    pinned: false,
    deleted: false,
    clientId: null,
    ...input,
  };
  db.messages.push(row);
  const chat = db.chats.find((c) => c.id === row.chatId);
  if (!chat) return row;

  // Автор сразу «прочитал» свой чат; удалённый у получателей чат возвращается
  if (row.authorId)
    chatState(db, row.authorId, chat.id).lastReadAt = row.createdAt;
  for (const memberId of chat.memberIds) {
    if (memberId === row.authorId) continue;
    const s = chatState(db, memberId, chat.id);
    s.deleted = false;
    notifyAboutMessage(db, memberId, chat, row);
  }
  return row;
}

function notifyAboutMessage(
  db: DB,
  userId: string,
  chat: ChatRow,
  m: MessageRow,
) {
  const user = findUser(db, userId);
  const author = findUser(db, m.authorId);
  if (!user || !author) return;
  const state = chatState(db, userId, chat.id);
  const mentioned = new RegExp(`@${firstName(user.name)}`, "i").test(m.text);
  if (state.muted && !mentioned) return;
  if (
    !mentioned &&
    user.mutedDepartmentIds.includes(author.departmentId) &&
    chat.kind !== "direct"
  )
    return;
  if (chat.kind === "channel") return;

  const preview = messagePreviewText(m);
  const title = chat.kind === "direct" ? author.name : chat.title;
  pushNotification(db, {
    userId,
    kind: mentioned ? "mention" : "message",
    title,
    body:
      chat.kind === "direct"
        ? preview
        : `${firstName(author.name)}: ${preview}`,
    link: `/chats/${chat.id}`,
    actorId: author.id,
    chatId: chat.id,
  });
}

export function messagePreviewText(
  m: Pick<MessageRow, "attachment" | "kind" | "taskEvent" | "text">,
) {
  if (m.text) return m.text;
  switch (m.kind) {
    case "image":
      return "📷 Фото";
    case "video":
      return "🎬 Видео";
    case "file":
      return `📎 ${m.attachment?.name ?? "Файл"}`;
    case "voice":
      return "🎤 Голосовое сообщение";
    case "call":
      return "📹 Видеозвонок";
    case "task_event":
      return m.taskEvent ? `${m.taskEvent.title}: ${m.taskEvent.text}` : "";
    default:
      return "";
  }
}

export function pushNotification(
  db: DB,
  n: {
    actorId: null | string;
    body: string;
    chatId: null | string;
    kind: NotificationKind;
    link: string;
    title: string;
    userId: string;
  },
) {
  db.notifications.unshift({
    id: uid("n"),
    createdAt: nowIso(),
    read: false,
    ...n,
  });
  if (db.notifications.length > 300) db.notifications.length = 300;
}

/* ── Задачи ────────────────────────────────────────────────────────────── */

export function toTask(db: DB, t: TaskRow): TaskDTO {
  const team = t.teamChatId
    ? db.chats.find((c) => c.id === t.teamChatId)
    : undefined;
  return {
    ...t,
    teamName: team?.title ?? null,
    commentsCount: db.comments.filter((c) => c.taskId === t.id).length,
  };
}

export function toComment(db: DB, c: CommentRow): CommentDTO {
  const reply = c.replyToId
    ? db.comments.find((x) => x.id === c.replyToId)
    : undefined;
  return {
    id: c.id,
    taskId: c.taskId,
    authorId: c.authorId,
    text: c.text,
    createdAt: c.createdAt,
    replyTo: reply
      ? { id: reply.id, authorId: reply.authorId, text: reply.text }
      : null,
    pinned: c.pinned,
  };
}

/** Событие задачи — публикуется в канал Daily */
export function postTaskEvent(
  db: DB,
  actorId: string,
  task: TaskRow,
  icon: TaskEvent["icon"],
  text: string,
) {
  const daily = db.chats.find((c) => c.kind === "channel");
  if (!daily) return;
  insertMessage(db, {
    chatId: daily.id,
    authorId: actorId,
    kind: "task_event",
    taskEvent: { taskId: task.id, icon, title: task.title, text },
  });
}

export function taskParticipants(db: DB, t: TaskRow) {
  const ids = new Set<string>([t.creatorId, ...t.assigneeIds]);
  if (t.assignAll && t.teamChatId) {
    db.chats
      .find((c) => c.id === t.teamChatId)
      ?.memberIds.forEach((id) => ids.add(id));
  }
  return [...ids];
}

export const STATUS_LABEL: Record<TaskRow["status"], string> = {
  backlog: "Бэклог",
  todo: "К выполнению",
  in_progress: "В работе",
  review: "Ревью",
  done: "Готово",
};

export function db() {
  return getDb();
}
