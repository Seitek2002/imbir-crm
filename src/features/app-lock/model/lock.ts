import { create } from "zustand";

import { useSession, useSettings } from "@/shared/model";

/** Заблокировано ли приложение прямо сейчас (не хранится — проверяется при запуске) */
export const useAppLock = create<{
  lock: () => void;
  locked: boolean;
  unlock: () => void;
}>()((set) => ({
  locked: Boolean(
    useSettings.getState().appLock && useSession.getState().token,
  ),
  lock: () => set({ locked: true }),
  unlock: () => set({ locked: false }),
}));
