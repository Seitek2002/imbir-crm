import { create } from "zustand";
import { persist } from "zustand/middleware";

/** Кто сейчас печатает: chatId → userIds. Наполняется realtime-событиями */
type TypingState = {
  setTyping: (chatId: string, userId: string, on: boolean) => void;
  typing: Record<string, string[]>;
};

export const useTyping = create<TypingState>()((set) => ({
  typing: {},
  setTyping: (chatId, userId, on) =>
    set((s) => {
      const cur = s.typing[chatId] ?? [];
      const next = on
        ? [...new Set([...cur, userId])]
        : cur.filter((id) => id !== userId);
      return { typing: { ...s.typing, [chatId]: next } };
    }),
}));

/** Черновики сообщений по чатам — переживают перезагрузку, как в Telegram */
type DraftsState = {
  drafts: Record<string, string>;
  setDraft: (chatId: string, text: string) => void;
};

export const useDrafts = create<DraftsState>()(
  persist(
    (set) => ({
      drafts: {},
      setDraft: (chatId, text) =>
        set((s) => {
          const drafts = { ...s.drafts };
          if (text.trim()) drafts[chatId] = text;
          else delete drafts[chatId];
          return { drafts };
        }),
    }),
    { name: "imbir.drafts" },
  ),
);
