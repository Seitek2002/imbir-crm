import { create } from "zustand";

/** Открыта ли командная палитра (десктоп, Ctrl/⌘+K) */
export const usePalette = create<{
  open: boolean;
  setOpen: (v: boolean) => void;
}>()((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));
