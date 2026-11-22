import { create } from "zustand";
import {
  type StateStorage,
  createJSONStorage,
  persist,
} from "zustand/middleware";

type SessionState = {
  clear: () => void;
  /** «Запомнить меня»: true — localStorage, false — сессия живёт до закрытия вкладки */
  remember: boolean;
  setSession: (s: { remember: boolean; token: string; userId: string }) => void;
  token: null | string;
  userId: null | string;
};

const KEY = "imbir.session";

/**
 * Хранилище выбирается по флагу remember внутри самого состояния:
 * так «Запомнить меня» работает как в настоящих приложениях.
 */
const sessionStorageAdapter: StateStorage = {
  getItem: (name) => localStorage.getItem(name) ?? sessionStorage.getItem(name),
  setItem: (name, value) => {
    let remember = true;
    try {
      remember = Boolean(JSON.parse(value).state.remember);
    } catch {
      /* оставляем localStorage */
    }
    const [target, other] = remember
      ? [localStorage, sessionStorage]
      : [sessionStorage, localStorage];
    target.setItem(name, value);
    other.removeItem(name);
  },
  removeItem: (name) => {
    localStorage.removeItem(name);
    sessionStorage.removeItem(name);
  },
};

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      token: null,
      userId: null,
      remember: true,
      setSession: ({ token, userId, remember }) =>
        set({ token, userId, remember }),
      clear: () => set({ token: null, userId: null }),
    }),
    { name: KEY, storage: createJSONStorage(() => sessionStorageAdapter) },
  ),
);

export const getToken = () => useSession.getState().token;
export const getUserId = () => useSession.getState().userId;
