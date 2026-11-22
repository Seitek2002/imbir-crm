import { create } from "zustand";
import { persist } from "zustand/middleware";

import type {
  TaskListParams,
  TaskPriority,
  TaskScope,
  TaskStatus,
} from "@/shared/api";

type FiltersState = {
  apply: (p: {
    hideDone: boolean;
    priorities: TaskPriority[];
    statuses: TaskStatus[];
  }) => void;
  hideDone: boolean;
  priorities: TaskPriority[];
  reset: () => void;
  scope: TaskScope;
  setScope: (s: TaskScope) => void;
  setView: (v: "calendar" | "list") => void;
  statuses: TaskStatus[];
  view: "calendar" | "list";
};

export const useTaskFilters = create<FiltersState>()(
  persist(
    (set) => ({
      view: "list",
      scope: "mine",
      statuses: [],
      priorities: [],
      hideDone: false,
      setView: (view) => set({ view }),
      setScope: (scope) => set({ scope }),
      apply: (p) => set(p),
      reset: () => set({ statuses: [], priorities: [], hideDone: false }),
    }),
    { name: "imbir.task-filters" },
  ),
);

export function useTaskListParams(): TaskListParams {
  const scope = useTaskFilters((s) => s.scope);
  const statuses = useTaskFilters((s) => s.statuses);
  const priorities = useTaskFilters((s) => s.priorities);
  const hideDone = useTaskFilters((s) => s.hideDone);
  return { scope, statuses, priorities, hideDone };
}

export function useActiveFiltersCount() {
  const statuses = useTaskFilters((s) => s.statuses.length);
  const priorities = useTaskFilters((s) => s.priorities.length);
  const hideDone = useTaskFilters((s) => s.hideDone);
  return statuses + priorities + (hideDone ? 1 : 0);
}
