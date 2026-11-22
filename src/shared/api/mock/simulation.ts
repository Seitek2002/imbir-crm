import type { TaskStatus } from "../types";
import { commit, getDb } from "./db";
import { realtime } from "./realtime";
import {
  STATUS_LABEL,
  chatState,
  findUser,
  insertMessage,
  nowIso,
  postTaskEvent,
  pushNotification,
  taskParticipants,
} from "./repo";

/**
 * «Живые коллеги»: отвечают в личке, читают сообщения, иногда пишут сами
 * и двигают задачи. Так видно, как приложение реагирует на события сервера.
 */

const DIRECT_REPLIES = [
  "Ок, принято 👍",
  "Сейчас посмотрю",
  "Да, давай так и сделаем",
  "Отлично, спасибо!",
  "Можешь скинуть ссылку на макет?",
  "Через 10 минут отвечу, я на созвоне",
  "Согласен",
  "Хм, интересно 🤔",
  "Добавил в задачи",
  "👍",
  "😁",
  "Давай обсудим на созвоне в 16:00?",
  "Уже делаю",
  "Понял, поправлю сегодня",
];

const GROUP_REPLIES = [
  "+1",
  "Поддерживаю",
  "Я посмотрю после обеда",
  "Готово ✅",
  "Кто-то уже взял в работу?",
  "Спасибо!",
  "Принято",
  "Проверил — всё ок",
  "🔥",
];

const AMBIENT = [
  "Коллеги, кто сегодня в офисе?",
  "Загрузил новую версию на тест",
  "Не забудьте обновить статусы задач",
  "Созвон переносится на 17:00",
  "Кто может глянуть баг с оплатой?",
  "Макеты обновил, ссылка в задаче",
  "Отчёт за неделю отправил на почту",
  "Сегодня деплой в 18:00 🚀",
  "Клиент подтвердил заказ 🎉",
  "Можно вас на минуту в переговорку?",
];

const rand = (n: number) => Math.floor(Math.random() * n);
const pick = <T>(arr: T[]) => arr[rand(arr.length)];

const pendingReplies = new Map<string, number[]>();

function later(chatId: string, ms: number, fn: () => void) {
  const id = window.setTimeout(fn, ms);
  pendingReplies.set(chatId, [...(pendingReplies.get(chatId) ?? []), id]);
}

function cancelPending(chatId: string) {
  pendingReplies.get(chatId)?.forEach((id) => window.clearTimeout(id));
  pendingReplies.delete(chatId);
}

export function simulateAfterSend(
  chatId: string,
  messageId: string,
  authorId: string,
) {
  const db = getDb();
  const chat = db.chats.find((c) => c.id === chatId);
  if (!chat || chat.kind === "channel") return;
  const others = chat.memberIds.filter((id) => id !== authorId);
  if (!others.length) return;

  // Серия сообщений подряд — отвечаем один раз, на последнее
  cancelPending(chatId);

  const reader = chat.kind === "direct" ? others[0] : pick(others);
  later(chatId, 600 + rand(700), () => {
    chatState(getDb(), reader, chatId).lastReadAt = nowIso();
    commit();
    realtime.emit({ type: "chats:changed", chatId });
  });

  const willReply = chat.kind === "direct" || Math.random() < 0.5;
  if (!willReply) return;
  const responder = reader;
  const typingAt = 1400 + rand(900);
  const replyAt = typingAt + 1400 + rand(1600);

  later(chatId, typingAt, () =>
    realtime.emit({
      type: "chat:typing",
      chatId,
      userId: responder,
      typing: true,
    }),
  );
  later(chatId, replyAt, () => {
    realtime.emit({
      type: "chat:typing",
      chatId,
      userId: responder,
      typing: false,
    });
    const m = insertMessage(getDb(), {
      chatId,
      authorId: responder,
      text: pick(chat.kind === "direct" ? DIRECT_REPLIES : GROUP_REPLIES),
      replyToId: Math.random() < 0.25 ? messageId : null,
    });
    commit();
    pendingReplies.delete(chatId);
    realtime.emit({
      type: "message:new",
      chatId,
      messageId: m.id,
      authorId: responder,
    });
    realtime.emit({ type: "notifications:changed" });
  });
}

/* ── Фоновая активность ────────────────────────────────────────────────── */

let ambientTimer: null | number = null;
let ambientUser: null | string = null;

const NEXT_STATUS: Partial<Record<TaskStatus, TaskStatus>> = {
  backlog: "todo",
  todo: "in_progress",
  in_progress: "review",
  review: "done",
};

function ambientMessage(userId: string) {
  const db = getDb();
  const chats = db.chats.filter(
    (c) =>
      c.kind !== "channel" &&
      c.memberIds.includes(userId) &&
      c.memberIds.length > 1,
  );
  if (!chats.length) return;
  const chat = pick(chats);
  const author = pick(chat.memberIds.filter((id) => id !== userId));
  realtime.emit({
    type: "chat:typing",
    chatId: chat.id,
    userId: author,
    typing: true,
  });
  window.setTimeout(() => {
    realtime.emit({
      type: "chat:typing",
      chatId: chat.id,
      userId: author,
      typing: false,
    });
    const m = insertMessage(getDb(), {
      chatId: chat.id,
      authorId: author,
      text: pick(AMBIENT),
    });
    commit();
    realtime.emit({
      type: "message:new",
      chatId: chat.id,
      messageId: m.id,
      authorId: author,
    });
    realtime.emit({ type: "notifications:changed" });
  }, 2200);
}

function ambientTaskMove(userId: string) {
  const db = getDb();
  const candidates = db.tasks.filter(
    (t) => t.status !== "done" && t.assigneeIds.some((id) => id !== userId),
  );
  if (!candidates.length) return;
  const task = pick(candidates);
  const next = NEXT_STATUS[task.status];
  if (!next) return;
  const actorId = pick(task.assigneeIds.filter((id) => id !== userId));
  const text = `${STATUS_LABEL[task.status]} → ${STATUS_LABEL[next]}`;
  task.status = next;
  task.updatedAt = nowIso();
  postTaskEvent(db, actorId, task, "status", text);
  const actor = findUser(db, actorId);
  for (const id of taskParticipants(db, task)) {
    if (id === actorId) continue;
    pushNotification(db, {
      userId: id,
      kind: "task",
      title: task.title,
      body: `${actor?.name ?? ""}: ${text}`,
      link: `/tasks/${task.id}`,
      actorId,
      chatId: null,
    });
  }
  commit();
  realtime.emit({ type: "tasks:changed", taskId: task.id });
  realtime.emit({ type: "chats:changed" });
  realtime.emit({ type: "notifications:changed" });
}

function scheduleAmbient(first = false) {
  const delay = first ? 35_000 + rand(15_000) : 60_000 + rand(60_000);
  ambientTimer = window.setTimeout(() => {
    if (ambientUser && document.visibilityState === "visible") {
      if (Math.random() < 0.25) ambientTaskMove(ambientUser);
      else ambientMessage(ambientUser);
    }
    scheduleAmbient();
  }, delay);
}

export function startSimulation(userId: string) {
  if (ambientUser === userId && ambientTimer) return;
  stopSimulation();
  ambientUser = userId;
  scheduleAmbient(true);
}

export function stopSimulation() {
  if (ambientTimer) window.clearTimeout(ambientTimer);
  ambientTimer = null;
  ambientUser = null;
}
