import type {
  Attachment,
  AvatarSpec,
  ChatKind,
  Department,
  ID,
  ISODate,
  MessageKind,
  NotificationKind,
  TaskEvent,
  TaskPriority,
  TaskStatus,
  User,
} from "../types";
import { createSeed } from "./seed";

/* Строки «таблиц» мок-бэкенда. Клиент их не видит — он получает DTO из types.ts. */

export interface UserRow extends User {
  mutedDepartmentIds: ID[];
  password: string;
}

export interface ChatRow {
  avatar: AvatarSpec;
  createdAt: ISODate;
  createdBy: ID | null;
  handle: null | string;
  id: ID;
  kind: ChatKind;
  memberIds: ID[];
  readOnly: boolean;
  title: string;
}

export interface ChatUserState {
  archived: boolean;
  deleted: boolean;
  lastReadAt: ISODate;
  muted: boolean;
  pinned: boolean;
}

export interface MessageRow {
  attachment: Attachment | null;
  authorId: ID | null;
  call: { durationSec: number; video: boolean } | null;
  chatId: ID;
  clientId: null | string;
  createdAt: ISODate;
  deleted: boolean;
  id: ID;
  kind: MessageKind;
  pinned: boolean;
  replyToId: ID | null;
  taskEvent: null | TaskEvent;
  text: string;
}

export interface TaskRow {
  assignAll: boolean;
  assigneeIds: ID[];
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
  title: string;
  updatedAt: ISODate;
}

export interface CommentRow {
  authorId: ID;
  createdAt: ISODate;
  id: ID;
  pinned: boolean;
  replyToId: ID | null;
  taskId: ID;
  text: string;
}

export interface NotificationRow {
  actorId: ID | null;
  body: string;
  chatId: ID | null;
  createdAt: ISODate;
  id: ID;
  kind: NotificationKind;
  link: string;
  read: boolean;
  title: string;
  userId: ID;
}

export interface StoryRow {
  bg: string;
  createdAt: ISODate;
  emoji: string;
  id: ID;
  seenBy: ID[];
  text: string;
  userId: ID;
}

export interface DB {
  chats: ChatRow[];
  /** userId → chatId → персональное состояние чата */
  chatState: Record<ID, Record<ID, ChatUserState>>;
  comments: CommentRow[];
  departments: Department[];
  messages: MessageRow[];
  notifications: NotificationRow[];
  /** Момент генерации демо-данных: до него коллеги «прочитали» всё */
  seededAt: ISODate;
  sessions: Record<string, ID>;
  stories: StoryRow[];
  tasks: TaskRow[];
  users: UserRow[];
  version: number;
}

export const DB_VERSION = 4;
const KEY = "imbir.db";

let db: DB | null = null;

export class StorageFullError extends Error {}

function load(): DB {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DB;
      if (parsed.version === DB_VERSION) return parsed;
    }
  } catch {
    /* битые данные — пересоздаём */
  }
  const fresh = createSeed(new Date());
  persist(fresh);
  return fresh;
}

function persist(data: DB) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch (e) {
    if (e instanceof DOMException && /quota/i.test(e.name + e.message)) {
      throw new StorageFullError("storage_full");
    }
    throw e;
  }
}

export function getDb(): DB {
  if (!db) db = load();
  return db;
}

/** Сохраняет изменения «на диск». Вызывается после каждой мутации. */
export function commit() {
  if (db) persist(db);
}

/** Другая вкладка поменяла данные — перечитываем */
export function reloadFromStorage() {
  db = null;
}

export function resetDb() {
  const sessions = db?.sessions ?? {};
  db = createSeed(new Date());
  db.sessions = sessions;
  persist(db);
}

export const DB_STORAGE_KEY = KEY;
