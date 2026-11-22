import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeMode = "dark" | "light" | "system";
export type Language = "en" | "ru";

type SettingsState = {
  /** Блокировка приложения «Face ID» при запуске */
  appLock: boolean;
  clearRecentSearches: () => void;
  language: Language;
  pushRecentSearch: (q: string) => void;
  recentSearches: string[];
  setAppLock: (on: boolean) => void;
  setLanguage: (language: Language) => void;
  setTheme: (theme: ThemeMode) => void;
  /** Развёрнутая боковая панель на десктопе (иконки + подписи) */
  sidebarExpanded: boolean;
  theme: ThemeMode;
  toggleSidebar: () => void;
};

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      theme: "light",
      language: "ru",
      appLock: false,
      sidebarExpanded: true,
      recentSearches: [],
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setAppLock: (appLock) => set({ appLock }),
      toggleSidebar: () =>
        set((s) => ({ sidebarExpanded: !s.sidebarExpanded })),
      pushRecentSearch: (q) =>
        set((s) => {
          const v = q.trim();
          if (!v) return s;
          return {
            recentSearches: [
              v,
              ...s.recentSearches.filter((x) => x !== v),
            ].slice(0, 8),
          };
        }),
      clearRecentSearches: () => set({ recentSearches: [] }),
    }),
    { name: "imbir.settings", version: 1 },
  ),
);

export function resolveDark(theme: ThemeMode) {
  return (
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)
  );
}
