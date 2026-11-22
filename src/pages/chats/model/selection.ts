import { create } from "zustand";

/** Режим «Изм.» в списке чатов: множественный выбор */
type SelectionState = {
  editMode: boolean;
  enter: () => void;
  exit: () => void;
  selected: string[];
  toggle: (id: string) => void;
};

export const useChatSelection = create<SelectionState>()((set) => ({
  editMode: false,
  selected: [],
  enter: () => set({ editMode: true, selected: [] }),
  exit: () => set({ editMode: false, selected: [] }),
  toggle: (id) =>
    set((s) => ({
      selected: s.selected.includes(id)
        ? s.selected.filter((x) => x !== id)
        : [...s.selected, id],
    })),
}));
