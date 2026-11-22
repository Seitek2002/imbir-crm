import { create } from "zustand";

import type { AvatarSpec } from "../api/types";
import { uid } from "../lib/id";

export type Toast = {
  closing?: boolean;
  id: string;
  text: string;
  tone: "default" | "error" | "success";
};

/** Баннер «пуш-уведомления» сверху экрана (новое сообщение в другом чате) */
export type Banner = {
  avatar?: AvatarSpec;
  avatarName?: string;
  closing?: boolean;
  href?: string;
  id: string;
  text: string;
  title: string;
};

type ToastState = {
  banners: Banner[];
  dismiss: (id: string) => void;
  dismissBanner: (id: string) => void;
  push: (text: string, tone?: Toast["tone"]) => void;
  showBanner: (b: Omit<Banner, "id">) => void;
  toasts: Toast[];
};

const EXIT_MS = 260;

export const useToasts = create<ToastState>()((set, get) => ({
  toasts: [],
  banners: [],
  push: (text, tone = "default") => {
    const id = uid("t");
    set((s) => ({ toasts: [...s.toasts.slice(-2), { id, text, tone }] }));
    window.setTimeout(() => get().dismiss(id), 2600);
  },
  dismiss: (id) => {
    set((s) => ({
      toasts: s.toasts.map((t) => (t.id === id ? { ...t, closing: true } : t)),
    }));
    window.setTimeout(
      () => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
      EXIT_MS,
    );
  },
  showBanner: (b) => {
    const id = uid("b");
    set((s) => ({ banners: [...s.banners.slice(-1), { ...b, id }] }));
    window.setTimeout(() => get().dismissBanner(id), 4200);
  },
  dismissBanner: (id) => {
    set((s) => ({
      banners: s.banners.map((x) =>
        x.id === id ? { ...x, closing: true } : x,
      ),
    }));
    window.setTimeout(
      () => set((s) => ({ banners: s.banners.filter((x) => x.id !== id) })),
      EXIT_MS,
    );
  },
}));

export const toast = {
  show: (text: string) => useToasts.getState().push(text),
  success: (text: string) => useToasts.getState().push(text, "success"),
  error: (text: string) => useToasts.getState().push(text, "error"),
};
