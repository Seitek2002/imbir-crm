/**
 * Контракт API — то, что «бэкенд» отдаёт клиенту.
 * Мок-сервер (shared/api/mock) реализует ровно эти типы, поэтому
 * переезд на настоящий бэкенд сводится к замене транспорта в client.ts.
 */

export type ID = string;
export type ISODate = string;

export type AvatarSpec =
  | { bg?: string; emoji: string; kind: "emoji" }
  | { color: string; kind: "color" }
  | { color: string; kind: "initials" }
  | { color?: string; kind: "group" }
  | { kind: "brand" }
  | { kind: "image"; src: string };

export type Presence = "dnd" | "offline" | "online";
export type Role = "admin" | "manager" | "member";

export interface User {
  avatar: AvatarSpec;
  departmentId: ID;
  email: string;
  handle: string;
  id: ID;
  lastSeenAt: ISODate;
  name: string;
  position: string;
  presence: Presence;
  role: Role;
  showInitials: boolean;
}

export interface Me extends User {
  mutedDepartmentIds: ID[];
  stats: { done: number; open: number };
}

export interface Department {
  id: ID;
  name: string;
}

/* ── Чаты ──────────────────────────────────────────────────────────────── */

export type ChatKind = "channel" | "direct" | "group";

export interface ChatDTO {
  /** Время последней активности — по нему сортируется список */
  activityAt: ISODate;
  archived: boolean;
  avatar: AvatarSpec;
  createdAt: ISODate;
  handle: null | string;
  id: ID;
  kind: ChatKind;
  lastMessage: MessageDTO | null;
  memberIds: ID[];
  membersCount: number;
  muted: boolean;
  /** Собеседник в личном чате */
  peerId: ID | null;
  pinned: boolean;
  pinnedMessage: MessageDTO | null;
  readOnly: boolean;
  title: string;
  unreadCount: number;
}

export type MessageKind =
  "call" | "file" | "image" | "task_event" | "text" | "video" | "voice";

export interface Attachment {
  durationSec?: number;
  height?: number;
  id: ID;
  mime: string;
  name: string;
  /** Ключ нарисованной заглушки для демо-картинок */
  placeholder?: string;
  size: number;
  /** data URL загруженного файла; у демо-данных — пусто, рисуем placeholder */
  url?: string;
  width?: number;
}

export interface TaskEvent {
  icon: "calendar" | "comment" | "created" | "status";
  taskId: ID;
  text: string;
  title: string;
}

export interface MessageReply {
  authorId: ID | null;
  id: ID;
  kind: MessageKind;
  text: string;
}

export interface MessageDTO {
  attachment: Attachment | null;
  authorId: ID | null;
  call: { durationSec: number; video: boolean } | null;
  chatId: ID;
  /** id, сгенерированный клиентом до ответа сервера (для оптимистичных обновлений) */
  clientId: null | string;
  createdAt: ISODate;
  id: ID;
  kind: MessageKind;
  pinned: boolean;
  replyTo: MessageReply | null;
  /** Для своих сообщений: доставлено или прочитано собеседником */
  status: "read" | "sent";
  taskEvent: null | TaskEvent;
  text: string;
}

export interface SendMessageInput {
  attachment?: Attachment | null;
  clientId?: string;
  kind?: MessageKind;
  replyToId?: ID | null;
  text: string;
}

export interface CreateChatInput {
  kind: "direct" | "group";
  memberIds: ID[];
  title?: string;
}

export type ChatBulkAction = "archive" | "delete" | "read" | "unarchive";

/* ── Задачи ────────────────────────────────────────────────────────────── */

export type TaskStatus = "backlog" | "done" | "in_progress" | "review" | "todo";
export type TaskPriority = "high" | "low" | "medium" | "urgent";

export interface TaskDTO {
  assignAll: boolean;
  assigneeIds: ID[];
  commentsCount: number;
  createdAt: ISODate;
  creatorId: ID;
  descriptionHtml: string;
  dueAt: ISODate | null;
  files: Attachment[];
  id: ID;
  priority: TaskPriority;
  status: TaskStatus;
  tags: string[];
  teamChatId: ID | null;
  teamName: null | string;
  title: string;
  updatedAt: ISODate;
}

export interface TaskInput {
  assignAll: boolean;
  assigneeIds: ID[];
  descriptionHtml: string;
  dueAt: ISODate | null;
  files: Attachment[];
  priority: TaskPriority;
  status: TaskStatus;
  tags: string[];
  teamChatId: ID | null;
  title: string;
}

export type TaskScope = "all" | "created" | "mine";

export interface TaskListParams {
  hideDone?: boolean;
  priorities?: TaskPriority[];
  scope: TaskScope;
  statuses?: TaskStatus[];
  teamChatId?: ID;
}

export interface CommentDTO {
  authorId: ID;
  createdAt: ISODate;
  id: ID;
  pinned: boolean;
  replyTo: { authorId: ID; id: ID; text: string } | null;
  taskId: ID;
  text: string;
}

/* ── Уведомления, статусы, поиск ───────────────────────────────────────── */

export type NotificationKind =
  "comment" | "digest" | "mention" | "message" | "task";

export interface NotificationDTO {
  actorId: ID | null;
  body: string;
  createdAt: ISODate;
  id: ID;
  kind: NotificationKind;
  /** Маршрут, который открывается по тапу */
  link: string;
  read: boolean;
  title: string;
}

export interface StoryDTO {
  bg: string;
  createdAt: ISODate;
  emoji: string;
  id: ID;
  seen: boolean;
  text: string;
  userId: ID;
  viewsCount: number;
}

export interface SearchResult {
  chats: ChatDTO[];
  messages: { chatTitle: string; message: MessageDTO }[];
  people: User[];
  tasks: TaskDTO[];
}

export interface LoginResponse {
  token: string;
  user: Me;
}
