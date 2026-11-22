/**
 * Имитация websocket-канала: мок-сервер публикует события,
 * клиент (features/realtime-bridge) подписывается и обновляет кэш TanStack Query.
 */
export type RealtimeEvent =
  | {
      authorId: null | string;
      chatId: string;
      messageId: string;
      type: "message:new";
    }
  | { chatId: string; type: "chat:typing"; typing: boolean; userId: string }
  | { chatId?: string; type: "chats:changed" }
  | { taskId: string; type: "comments:changed" }
  | { taskId?: string; type: "tasks:changed" }
  | { type: "me:changed" }
  | { type: "notifications:changed" }
  | { type: "reset" }
  | { type: "stories:changed" };

type Listener = (event: RealtimeEvent) => void;

const listeners = new Set<Listener>();

export const realtime = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  emit(event: RealtimeEvent) {
    // Асинхронно, как пакет из сокета: не внутри обработчика запроса
    queueMicrotask(() => listeners.forEach((l) => l(event)));
  },
};
