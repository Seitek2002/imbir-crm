import { uid } from "../../lib/id";
import type {
  ChatBulkAction,
  CreateChatInput,
  LoginResponse,
  Me,
  SearchResult,
  SendMessageInput,
  StoryDTO,
  TaskInput,
  TaskListParams,
  TaskPriority,
} from "../types";
import { type ChatRow, type DB, commit, getDb, resetDb } from "./db";
import { realtime } from "./realtime";
import {
  STATUS_LABEL,
  chatMessages,
  chatState,
  findUser,
  firstName,
  insertMessage,
  isAssignee,
  markChatRead,
  nowIso,
  postTaskEvent,
  pushNotification,
  sortChats,
  taskParticipants,
  toChat,
  toComment,
  toMe,
  toMessage,
  toTask,
  toUser,
  visibleChats,
} from "./repo";
import { simulateAfterSend } from "./simulation";

/* ── Мини-роутер ───────────────────────────────────────────────────────── */

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

type Ctx = {
  body: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  db: DB;
  params: Record<string, string>;
  query: Record<string, unknown>;
  userId: string;
};

type Route = {
  auth: boolean;
  handler: (ctx: Ctx) => unknown;
  keys: string[];
  method: string;
  re: RegExp;
};

const routes: Route[] = [];

function route(
  method: string,
  path: string,
  handler: (ctx: Ctx) => unknown,
  auth = true,
) {
  const keys: string[] = [];
  const re = new RegExp(
    "^" +
      path.replace(/:(\w+)/g, (_, k) => {
        keys.push(k);
        return "([^/]+)";
      }) +
      "$",
  );
  routes.push({ method, re, keys, handler, auth });
}

export type MockRequest = {
  body?: unknown;
  method: string;
  path: string;
  query?: Record<string, unknown>;
  token: null | string;
};

export function handleRequest(req: MockRequest): unknown {
  const db = getDb();
  for (const r of routes) {
    if (r.method !== req.method) continue;
    const match = r.re.exec(req.path);
    if (!match) continue;
    const params: Record<string, string> = {};
    r.keys.forEach((k, i) => (params[k] = decodeURIComponent(match[i + 1])));
    const userId = req.token ? db.sessions[req.token] : undefined;
    if (r.auth && !userId) throw new HttpError(401, "unauthorized");
    return r.handler({
      params,
      query: req.query ?? {},
      body: req.body ?? {},
      userId: userId ?? "",
      db,
    });
  }
  throw new HttpError(404, `Route not found: ${req.method} ${req.path}`);
}

function must<T>(value: null | T | undefined, msg = "not_found"): T {
  if (value == null) throw new HttpError(404, msg);
  return value;
}

function getChatFor(db: DB, chatId: string, userId: string): ChatRow {
  const chat = must(db.chats.find((c) => c.id === chatId));
  if (!chat.memberIds.includes(userId)) throw new HttpError(403, "forbidden");
  return chat;
}

/* ── Auth ──────────────────────────────────────────────────────────────── */

route(
  "POST",
  "/auth/login",
  ({ db, body }): LoginResponse => {
    const email = String(body.email ?? "")
      .trim()
      .toLowerCase();
    const user = db.users.find((u) => u.email.toLowerCase() === email);
    if (!user || user.password !== body.password)
      throw new HttpError(401, "invalid_credentials");
    const token = uid("tok_");
    db.sessions[token] = user.id;
    user.presence = "online";
    user.lastSeenAt = nowIso();
    commit();
    return { token, user: toMe(db, user) };
  },
  false,
);

route("POST", "/auth/logout", ({ db, userId }) => {
  for (const [token, id] of Object.entries(db.sessions))
    if (id === userId) delete db.sessions[token];
  const user = findUser(db, userId);
  if (user) user.lastSeenAt = nowIso();
  commit();
  return { ok: true };
});

route(
  "POST",
  "/auth/forgot",
  ({ db, body }) => {
    const email = String(body.email ?? "")
      .trim()
      .toLowerCase();
    if (!db.users.some((u) => u.email.toLowerCase() === email))
      throw new HttpError(404, "user_not_found");
    return { ok: true };
  },
  false,
);

/* ── Профиль ───────────────────────────────────────────────────────────── */

route("GET", "/me", ({ db, userId }) => toMe(db, must(findUser(db, userId))));

route("PATCH", "/me", ({ db, userId, body }): Me => {
  const user = must(findUser(db, userId));
  const allowed = [
    "name",
    "position",
    "avatar",
    "showInitials",
    "presence",
  ] as const;
  for (const key of allowed) {
    if (body[key] !== undefined)
      (user as unknown as Record<string, unknown>)[key] = body[key];
  }
  if (typeof body.name === "string" && !body.name.trim())
    throw new HttpError(422, "name_required");
  commit();
  realtime.emit({ type: "me:changed" });
  return toMe(db, user);
});

route("POST", "/me/password", ({ db, userId, body }) => {
  const user = must(findUser(db, userId));
  if (user.password !== body.current)
    throw new HttpError(422, "wrong_password");
  if (String(body.next ?? "").length < 6)
    throw new HttpError(422, "password_short");
  user.password = body.next;
  commit();
  return { ok: true };
});

route("PATCH", "/me/departments", ({ db, userId, body }): Me => {
  const user = must(findUser(db, userId));
  user.mutedDepartmentIds = Array.isArray(body.mutedDepartmentIds)
    ? body.mutedDepartmentIds
    : [];
  commit();
  return toMe(db, user);
});

route("GET", "/users", ({ db }) => db.users.map(toUser));
route("GET", "/departments", ({ db }) => db.departments);

/* ── Чаты ──────────────────────────────────────────────────────────────── */

route("GET", "/chats", ({ db, userId }) =>
  sortChats(visibleChats(db, userId).map((c) => toChat(db, c, userId))),
);

route("GET", "/chats/:id", ({ db, userId, params }) =>
  toChat(db, getChatFor(db, params.id, userId), userId),
);

route("POST", "/chats", ({ db, userId, body }) => {
  const input = body as CreateChatInput;
  const others = (input.memberIds ?? []).filter((id) => id !== userId);
  if (!others.length) throw new HttpError(422, "members_required");

  if (input.kind === "direct") {
    const peer = others[0];
    let chat = db.chats.find(
      (c) =>
        c.kind === "direct" &&
        c.memberIds.includes(userId) &&
        c.memberIds.includes(peer),
    );
    if (!chat) {
      chat = {
        id: uid("c"),
        kind: "direct",
        title: "",
        handle: null,
        avatar: { kind: "group" },
        memberIds: [userId, peer],
        readOnly: false,
        createdAt: nowIso(),
        createdBy: userId,
      };
      db.chats.push(chat);
    }
    chatState(db, userId, chat.id).deleted = false;
    commit();
    realtime.emit({ type: "chats:changed" });
    return toChat(db, chat, userId);
  }

  const title = String(input.title ?? "").trim();
  if (!title) throw new HttpError(422, "title_required");
  const colors = [
    "#fc246c",
    "#6c42fc",
    "#18baba",
    "#3c7efc",
    "#fc8400",
    "#06ae72",
  ];
  const chat: ChatRow = {
    id: uid("c"),
    kind: "group",
    title,
    handle: title.toLowerCase().replace(/\s+/g, ""),
    avatar: { kind: "group", color: colors[db.chats.length % colors.length] },
    memberIds: [userId, ...others],
    readOnly: false,
    createdAt: nowIso(),
    createdBy: userId,
  };
  db.chats.push(chat);
  const author = findUser(db, userId);
  for (const id of others) {
    pushNotification(db, {
      userId: id,
      kind: "message",
      title: chat.title,
      body: `${author?.name ?? ""} добавил(а) вас в группу`,
      link: `/chats/${chat.id}`,
      actorId: userId,
      chatId: chat.id,
    });
  }
  commit();
  realtime.emit({ type: "chats:changed" });
  return toChat(db, chat, userId);
});

route("PATCH", "/chats/:id/state", ({ db, userId, params, body }) => {
  const chat = getChatFor(db, params.id, userId);
  const s = chatState(db, userId, chat.id);
  for (const key of ["pinned", "muted", "archived"] as const) {
    if (typeof body[key] === "boolean") s[key] = body[key];
  }
  commit();
  return toChat(db, chat, userId);
});

route("POST", "/chats/:id/read", ({ db, userId, params }) => {
  const chat = getChatFor(db, params.id, userId);
  markChatRead(db, userId, chat.id);
  commit();
  realtime.emit({ type: "notifications:changed" });
  return { ok: true };
});

route("POST", "/chats/bulk", ({ db, userId, body }) => {
  const ids: string[] = body.ids ?? [];
  const action = body.action as ChatBulkAction;
  for (const id of ids) {
    const chat = getChatFor(db, id, userId);
    const s = chatState(db, userId, chat.id);
    if (action === "read") markChatRead(db, userId, chat.id);
    if (action === "archive") s.archived = true;
    if (action === "unarchive") s.archived = false;
    if (action === "delete") {
      s.deleted = true;
      s.pinned = false;
      s.archived = false;
      markChatRead(db, userId, chat.id);
    }
  }
  commit();
  realtime.emit({ type: "notifications:changed" });
  return { ok: true };
});

route("POST", "/chats/:id/leave", ({ db, userId, params }) => {
  const chat = getChatFor(db, params.id, userId);
  if (chat.kind !== "group") throw new HttpError(422, "not_a_group");
  chat.memberIds = chat.memberIds.filter((id) => id !== userId);
  commit();
  return { ok: true };
});

route("GET", "/chats/:id/messages", ({ db, userId, params }) => {
  const chat = getChatFor(db, params.id, userId);
  return chatMessages(db, chat.id).map((m) => toMessage(db, m, userId));
});

route("POST", "/chats/:id/messages", ({ db, userId, params, body }) => {
  const chat = getChatFor(db, params.id, userId);
  if (chat.readOnly) throw new HttpError(403, "read_only");
  const input = body as SendMessageInput;
  const text = String(input.text ?? "").trim();
  if (!text && !input.attachment) throw new HttpError(422, "empty_message");
  const row = insertMessage(db, {
    chatId: chat.id,
    authorId: userId,
    kind: input.kind ?? (input.attachment ? "file" : "text"),
    text,
    replyToId: input.replyToId ?? null,
    attachment: input.attachment ?? null,
    clientId: input.clientId ?? null,
  });
  commit();
  realtime.emit({ type: "chats:changed", chatId: chat.id });
  simulateAfterSend(chat.id, row.id, userId);
  return toMessage(db, row, userId);
});

route("DELETE", "/messages/:id", ({ db, userId, params }) => {
  const m = must(db.messages.find((x) => x.id === params.id));
  const user = findUser(db, userId);
  if (m.authorId !== userId && user?.role !== "admin")
    throw new HttpError(403, "forbidden");
  m.deleted = true;
  commit();
  realtime.emit({ type: "chats:changed", chatId: m.chatId });
  return { ok: true };
});

route("POST", "/messages/:id/pin", ({ db, userId, params, body }) => {
  const m = must(db.messages.find((x) => x.id === params.id));
  getChatFor(db, m.chatId, userId);
  m.pinned = Boolean(body.pinned);
  commit();
  realtime.emit({ type: "chats:changed", chatId: m.chatId });
  return toMessage(db, m, userId);
});

/* ── Задачи ────────────────────────────────────────────────────────────── */

const PRIORITY_WEIGHT: Record<TaskPriority, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
};

route("GET", "/tasks", ({ db, userId, query }) => {
  const p = query as unknown as TaskListParams;
  let list = db.tasks.filter((t) => {
    if (p.scope === "mine") return isAssignee(db, t, userId);
    if (p.scope === "created") return t.creatorId === userId;
    return true;
  });
  if (p.statuses?.length)
    list = list.filter((t) => p.statuses!.includes(t.status));
  if (p.priorities?.length)
    list = list.filter((t) => p.priorities!.includes(t.priority));
  if (p.hideDone) list = list.filter((t) => t.status !== "done");
  if (p.teamChatId) list = list.filter((t) => t.teamChatId === p.teamChatId);
  list = [...list].sort((a, b) => {
    const ad = a.status === "done" ? 1 : 0;
    const bd = b.status === "done" ? 1 : 0;
    if (ad !== bd) return ad - bd;
    if (!ad) {
      const w = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
      if (w) return w;
    }
    return b.updatedAt.localeCompare(a.updatedAt);
  });
  return list.map((t) => toTask(db, t));
});

route("GET", "/tasks/:id", ({ db, params }) =>
  toTask(db, must(db.tasks.find((t) => t.id === params.id))),
);

function validateTask(input: Partial<TaskInput>) {
  if (input.title !== undefined && !String(input.title).trim())
    throw new HttpError(422, "title_required");
}

route("POST", "/tasks", ({ db, userId, body }) => {
  const input = body as TaskInput;
  validateTask(input);
  const now = nowIso();
  const task = {
    id: uid("t"),
    title: input.title.trim(),
    descriptionHtml: input.descriptionHtml ?? "",
    status: input.status ?? "todo",
    priority: input.priority ?? "medium",
    creatorId: userId,
    assigneeIds: input.assigneeIds ?? [],
    assignAll: Boolean(input.assignAll),
    teamChatId: input.teamChatId ?? null,
    dueAt: input.dueAt ?? null,
    tags: input.tags ?? [],
    files: input.files ?? [],
    createdAt: now,
    updatedAt: now,
  };
  db.tasks.push(task);
  const author = findUser(db, userId);
  for (const id of taskParticipants(db, task)) {
    if (id === userId) continue;
    pushNotification(db, {
      userId: id,
      kind: "task",
      title: "Новая задача",
      body: `${author?.name ?? ""} назначил(а) вам «${task.title}»`,
      link: `/tasks/${task.id}`,
      actorId: userId,
      chatId: null,
    });
  }
  const names = task.assignAll
    ? "вся команда"
    : task.assigneeIds
        .map((id) => firstName(findUser(db, id)?.name ?? ""))
        .join(", ");
  postTaskEvent(
    db,
    userId,
    task,
    "created",
    names ? `Исполнители: ${names}` : "Создана",
  );
  commit();
  realtime.emit({ type: "tasks:changed" });
  realtime.emit({ type: "chats:changed" });
  return toTask(db, task);
});

route("PATCH", "/tasks/:id", ({ db, userId, params, body }) => {
  const task = must(db.tasks.find((t) => t.id === params.id));
  const input = body as Partial<TaskInput>;
  validateTask(input);
  const prevStatus = task.status;
  const prevDue = task.dueAt;
  const fields = [
    "title",
    "descriptionHtml",
    "status",
    "priority",
    "assigneeIds",
    "assignAll",
    "teamChatId",
    "dueAt",
    "tags",
    "files",
  ] as const;
  for (const key of fields) {
    if (input[key] !== undefined)
      (task as unknown as Record<string, unknown>)[key] = input[key];
  }
  task.updatedAt = nowIso();

  if (input.status && input.status !== prevStatus) {
    const text = `${STATUS_LABEL[prevStatus]} → ${STATUS_LABEL[task.status]}`;
    postTaskEvent(db, userId, task, "status", text);
    const author = findUser(db, userId);
    for (const id of taskParticipants(db, task)) {
      if (id === userId) continue;
      pushNotification(db, {
        userId: id,
        kind: "task",
        title: task.title,
        body: `${author?.name ?? ""}: ${text}`,
        link: `/tasks/${task.id}`,
        actorId: userId,
        chatId: null,
      });
    }
  }
  if (input.dueAt !== undefined && input.dueAt !== prevDue && task.dueAt) {
    postTaskEvent(db, userId, task, "calendar", `→ ${task.dueAt.slice(0, 10)}`);
  }
  commit();
  realtime.emit({ type: "tasks:changed", taskId: task.id });
  realtime.emit({ type: "chats:changed" });
  return toTask(db, task);
});

route("DELETE", "/tasks/:id", ({ db, params }) => {
  const idx = db.tasks.findIndex((t) => t.id === params.id);
  if (idx < 0) throw new HttpError(404, "not_found");
  db.tasks.splice(idx, 1);
  db.comments = db.comments.filter((c) => c.taskId !== params.id);
  commit();
  realtime.emit({ type: "tasks:changed" });
  return { ok: true };
});

route("GET", "/tasks/:id/comments", ({ db, params }) =>
  db.comments
    .filter((c) => c.taskId === params.id)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((c) => toComment(db, c)),
);

route("POST", "/tasks/:id/comments", ({ db, userId, params, body }) => {
  const task = must(db.tasks.find((t) => t.id === params.id));
  const text = String(body.text ?? "").trim();
  if (!text) throw new HttpError(422, "empty_comment");
  const row = {
    id: uid("cm"),
    taskId: task.id,
    authorId: userId,
    text,
    createdAt: nowIso(),
    replyToId: body.replyToId ?? null,
    pinned: false,
  };
  db.comments.push(row);
  task.updatedAt = row.createdAt;
  postTaskEvent(db, userId, task, "comment", text);
  const author = findUser(db, userId);
  for (const id of taskParticipants(db, task)) {
    if (id === userId) continue;
    const user = findUser(db, id);
    const mentioned = user
      ? new RegExp(`@${firstName(user.name)}`, "i").test(text)
      : false;
    pushNotification(db, {
      userId: id,
      kind: mentioned ? "mention" : "comment",
      title: task.title,
      body: `${author?.name ?? ""}: ${text}`,
      link: `/tasks/${task.id}`,
      actorId: userId,
      chatId: null,
    });
  }
  commit();
  realtime.emit({ type: "comments:changed", taskId: task.id });
  realtime.emit({ type: "chats:changed" });
  return toComment(db, row);
});

route("DELETE", "/comments/:id", ({ db, userId, params }) => {
  const c = must(db.comments.find((x) => x.id === params.id));
  if (c.authorId !== userId) throw new HttpError(403, "forbidden");
  db.comments = db.comments.filter((x) => x.id !== c.id);
  commit();
  realtime.emit({ type: "comments:changed", taskId: c.taskId });
  return { ok: true };
});

route("POST", "/comments/:id/pin", ({ db, params, body }) => {
  const c = must(db.comments.find((x) => x.id === params.id));
  c.pinned = Boolean(body.pinned);
  commit();
  realtime.emit({ type: "comments:changed", taskId: c.taskId });
  return toComment(db, c);
});

/* ── Уведомления ───────────────────────────────────────────────────────── */

route("GET", "/notifications", ({ db, userId }) =>
  db.notifications
    .filter((n) => n.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(({ userId: _u, chatId: _c, ...n }) => n),
);

route("POST", "/notifications/:id/read", ({ db, userId, params }) => {
  const n = must(
    db.notifications.find((x) => x.id === params.id && x.userId === userId),
  );
  n.read = true;
  commit();
  return { ok: true };
});

route("POST", "/notifications/read-all", ({ db, userId }) => {
  db.notifications.forEach((n) => {
    if (n.userId === userId) n.read = true;
  });
  commit();
  return { ok: true };
});

/* ── Статусы ───────────────────────────────────────────────────────────── */

const STORY_TTL = 24 * 3_600_000;

route("GET", "/stories", ({ db, userId }): StoryDTO[] => {
  const alive = db.stories.filter(
    (s) => Date.now() - new Date(s.createdAt).getTime() < STORY_TTL,
  );
  const latest = new Map<string, (typeof alive)[number]>();
  for (const s of alive) {
    const cur = latest.get(s.userId);
    if (!cur || cur.createdAt < s.createdAt) latest.set(s.userId, s);
  }
  return [...latest.values()]
    .map((s) => ({
      id: s.id,
      userId: s.userId,
      text: s.text,
      emoji: s.emoji,
      bg: s.bg,
      createdAt: s.createdAt,
      seen: s.userId === userId || s.seenBy.includes(userId),
      viewsCount: s.seenBy.length,
    }))
    .sort((a, b) => {
      if (a.userId === userId) return -1;
      if (b.userId === userId) return 1;
      if (a.seen !== b.seen) return a.seen ? 1 : -1;
      return b.createdAt.localeCompare(a.createdAt);
    });
});

route("POST", "/stories", ({ db, userId, body }) => {
  const text = String(body.text ?? "").trim();
  if (!text) throw new HttpError(422, "text_required");
  db.stories = db.stories.filter((s) => s.userId !== userId);
  db.stories.push({
    id: uid("s"),
    userId,
    text,
    emoji: body.emoji ?? "✨",
    bg: body.bg ?? "sunset",
    createdAt: nowIso(),
    seenBy: [],
  });
  commit();
  realtime.emit({ type: "stories:changed" });
  return { ok: true };
});

route("DELETE", "/stories/:id", ({ db, userId, params }) => {
  db.stories = db.stories.filter(
    (s) => !(s.id === params.id && s.userId === userId),
  );
  commit();
  realtime.emit({ type: "stories:changed" });
  return { ok: true };
});

route("POST", "/stories/:id/seen", ({ db, userId, params }) => {
  const s = db.stories.find((x) => x.id === params.id);
  if (s && !s.seenBy.includes(userId) && s.userId !== userId)
    s.seenBy.push(userId);
  commit();
  return { ok: true };
});

/* ── Поиск ─────────────────────────────────────────────────────────────── */

route("GET", "/search", ({ db, userId, query }): SearchResult => {
  const q = String(query.q ?? "")
    .trim()
    .toLowerCase();
  if (!q) return { chats: [], tasks: [], people: [], messages: [] };
  const has = (s: null | string | undefined) =>
    (s ?? "").toLowerCase().includes(q);
  const chats = visibleChats(db, userId).map((c) => toChat(db, c, userId));
  const chatIds = new Set(chats.map((c) => c.id));
  return {
    chats: chats.filter((c) => has(c.title) || has(c.handle)).slice(0, 20),
    tasks: db.tasks
      .filter(
        (t) =>
          has(t.title) ||
          t.tags.some(has) ||
          has(t.descriptionHtml.replace(/<[^>]+>/g, " ")),
      )
      .slice(0, 20)
      .map((t) => toTask(db, t)),
    people: db.users
      .filter((u) => has(u.name) || has(u.email) || has(u.position))
      .slice(0, 20)
      .map(toUser),
    messages: db.messages
      .filter((m) => chatIds.has(m.chatId) && !m.deleted && has(m.text))
      .slice(-20)
      .reverse()
      .map((m) => ({
        message: toMessage(db, m, userId),
        chatTitle: chats.find((c) => c.id === m.chatId)?.title ?? "",
      })),
  };
});

/* ── Демо ──────────────────────────────────────────────────────────────── */

route("POST", "/demo/reset", () => {
  resetDb();
  realtime.emit({ type: "reset" });
  return { ok: true };
});
