import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";

import {
  CalendarX2,
  ChevronDown,
  ChevronRight,
  CircleCheck,
  ListFilter,
  Plus,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";

import {
  TaskFiltersSheet,
  useActiveFiltersCount,
  useTaskFilters,
  useTaskListParams,
} from "@/features/task-filters";

import {
  STATUS_COLOR,
  TaskCard,
  useTasks,
  useUpdateTask,
} from "@/entities/task";
import { useUserMap } from "@/entities/user";

import type { TaskDTO, TaskScope } from "@/shared/api";
import {
  cn,
  getLocale,
  haptic,
  isSameDay,
  toDateKey,
  useIsDesktop,
  useScrollRestore,
  useT,
} from "@/shared/lib";
import { toast } from "@/shared/model";
import {
  ActionSheet,
  CountBadge,
  EmptyState,
  IconButton,
  MonthCalendar,
  Segmented,
  Skeleton,
  SwipeRow,
} from "@/shared/ui";

export function TasksPanel() {
  const t = useT();
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const { taskId: activeId } = useParams();
  const view = useTaskFilters((s) => s.view);
  const setView = useTaskFilters((s) => s.setView);
  const scope = useTaskFilters((s) => s.scope);
  const setScope = useTaskFilters((s) => s.setScope);
  const params = useTaskListParams();
  const filtersCount = useActiveFiltersCount();
  const { data: tasks, isLoading, isFetching } = useTasks(params);
  const users = useUserMap();
  const update = useUpdateTask();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [scopeOpen, setScopeOpen] = useState(false);
  const scrollRef = useScrollRestore<HTMLDivElement>(`tasks-${view}`);

  const scopeLabel: Record<TaskScope, string> = {
    mine: t.tasks.scopeMine,
    created: t.tasks.scopeCreated,
    all: t.tasks.scopeAll,
  };

  const open = (task: TaskDTO) =>
    navigate(`/tasks/${task.id}`, { replace: isDesktop && Boolean(activeId) });

  const toggleDone = (task: TaskDTO) => {
    haptic("success");
    const next = task.status === "done" ? "in_progress" : "done";
    update.mutate({ id: task.id, patch: { status: next } });
    toast.show(next === "done" ? `✓ ${t.tasks.statuses.done}` : t.tasks.reopen);
  };

  const card = (task: TaskDTO, i: number) => (
    <SwipeRow
      key={task.id}
      className="rounded-2xl"
      left={[
        task.status === "done"
          ? {
              label: t.tasks.reopen,
              icon: <RotateCcw />,
              color: "#3c7efc",
              onAction: () => toggleDone(task),
            }
          : {
              label: t.tasks.markDone,
              icon: <CircleCheck />,
              color: "#06ae72",
              onAction: () => toggleDone(task),
            },
      ]}
    >
      <TaskCard
        task={task}
        active={isDesktop && task.id === activeId}
        assignees={task.assigneeIds
          .map((id) => users.get(id))
          .filter((u) => u !== undefined)}
        onClick={() => open(task)}
        onKeyDown={(e) => e.key === "Enter" && open(task)}
        className="animate-fade-up"
        style={{ animationDelay: `${Math.min(i, 8) * 25}ms` }}
      />
    </SwipeRow>
  );

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-bg lg:bg-surface">
      <header className="shrink-0 pt-safe">
        <div className="relative flex h-[3.375rem] items-center justify-between px-3 lg:h-14">
          <span className="relative">
            <IconButton
              label={t.tasks.filters}
              onClick={() => setFiltersOpen(true)}
            >
              <SlidersHorizontal className="text-fg" />
            </IconButton>
            {filtersCount > 0 && (
              <CountBadge
                count={filtersCount}
                className="absolute -right-0.5 -top-0.5 h-4 min-w-4 px-1 text-[0.625rem]"
              />
            )}
          </span>
          <h1 className="absolute left-1/2 -translate-x-1/2 text-[1.0625rem] font-semibold">
            {t.tasks.title}
          </h1>
          <IconButton
            label={t.tasks.newTask}
            variant="solid"
            size="sm"
            onClick={() => navigate("/tasks/new")}
          >
            <Plus className="size-5!" strokeWidth={3} />
          </IconButton>
        </div>
        <div className="px-4 pb-2">
          <Segmented
            value={view}
            onChange={setView}
            options={[
              { value: "list", label: t.tasks.list },
              { value: "calendar", label: t.tasks.calendar },
            ]}
          />
        </div>
        <button
          type="button"
          onClick={() => setScopeOpen(true)}
          className="mx-4 mb-2 flex h-10 w-[calc(100%-2rem)] items-center gap-2 rounded-xl bg-surface-2/80 px-3 text-left transition-colors active:bg-surface-3 lg:bg-surface-2"
        >
          <ListFilter className="size-4 text-fg-2" />
          <span className="flex-1 text-[0.9375rem] font-medium">
            {scopeLabel[scope]}
          </span>
          <span
            className={cn(
              "text-[0.9375rem] text-fg-2 transition-opacity",
              isFetching && "opacity-40",
            )}
          >
            {tasks?.length ?? "–"}
          </span>
          <ChevronDown className="size-4 text-fg-3" />
        </button>
      </header>

      <div
        ref={scrollRef}
        data-tab-scroll
        className="scroll-area min-h-0 flex-1 px-4 pb-28 pt-1 lg:pb-6"
      >
        {isLoading ? (
          <div className="flex flex-col gap-2.5">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
        ) : view === "list" ? (
          tasks?.length ? (
            <div className="flex flex-col gap-2.5">{tasks.map(card)}</div>
          ) : (
            <EmptyState
              icon={<CircleCheck />}
              title={t.tasks.empty}
              text={t.tasks.emptyHint}
            />
          )
        ) : (
          <CalendarView tasks={tasks ?? []} renderCard={card} />
        )}
      </div>

      <TaskFiltersSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
      />
      <ActionSheet
        open={scopeOpen}
        onClose={() => setScopeOpen(false)}
        cancelLabel={t.common.cancel}
        options={(["mine", "created", "all"] as TaskScope[]).map((s) => ({
          label: scopeLabel[s],
          selected: s === scope,
          onSelect: () => setScope(s),
        }))}
      />
    </div>
  );
}

/* ── Календарь ─────────────────────────────────────────────────────────── */

function CalendarView({
  tasks,
  renderCard,
}: {
  renderCard: (t: TaskDTO, i: number) => React.ReactNode;
  tasks: TaskDTO[];
}) {
  const t = useT();
  const [month, setMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [selected, setSelected] = useState<Date | null>(null);
  const [noDueOpen, setNoDueOpen] = useState(false);

  const marks = useMemo(() => {
    const m: Record<string, string[]> = {};
    for (const task of tasks) {
      if (!task.dueAt) continue;
      const k = toDateKey(task.dueAt);
      (m[k] ??= []).push(STATUS_COLOR[task.status]);
    }
    return m;
  }, [tasks]);

  const inMonth = tasks.filter((x) => {
    if (!x.dueAt) return false;
    const d = new Date(x.dueAt);
    return (
      d.getMonth() === month.getMonth() &&
      d.getFullYear() === month.getFullYear()
    );
  }).length;
  const noDue = tasks.filter((x) => !x.dueAt);
  const dayTasks = selected
    ? tasks.filter((x) => x.dueAt && isSameDay(x.dueAt, selected))
    : [];

  return (
    <div className="animate-fade-in">
      <div className="rounded-2xl bg-surface p-3 shadow-[0_1px_2px_rgb(0_0_0/0.04)] lg:bg-surface-2/50">
        <MonthCalendar
          month={month}
          onMonthChange={setMonth}
          selected={selected}
          onSelect={setSelected}
          marks={marks}
          caption={t.tasks.tasksCount(inMonth)}
          todayLabel={t.common.today}
        />
      </div>

      {selected ? (
        <div className="mt-4">
          <div className="mb-2 px-1 text-[0.8125rem] font-medium uppercase tracking-wide text-fg-2">
            {selected.toLocaleDateString(getLocale(), {
              day: "numeric",
              month: "long",
              weekday: "short",
            })}
          </div>
          {dayTasks.length ? (
            <div key={selected.toISOString()} className="flex flex-col gap-2.5">
              {dayTasks.map(renderCard)}
            </div>
          ) : (
            <p className="py-6 text-center text-[0.9375rem] text-fg-3">
              {t.tasks.empty}
            </p>
          )}
        </div>
      ) : (
        <p className="py-4 text-center text-[0.875rem] text-fg-3">
          {t.tasks.tapDate}
        </p>
      )}

      <button
        type="button"
        onClick={() => setNoDueOpen((v) => !v)}
        className="mt-3 flex w-full items-center gap-3 rounded-2xl bg-surface p-3.5 text-left active:bg-surface-2 lg:bg-surface-2/50"
      >
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <CalendarX2 className="size-5" />
        </span>
        <span className="flex-1">
          <span className="block text-[1rem] font-semibold">
            {t.tasks.noDeadline}
          </span>
          <span className="block text-[0.8125rem] text-fg-2">
            {t.tasks.tasksCount(noDue.length)}
          </span>
        </span>
        <CountBadge count={noDue.length} />
        <ChevronRight
          className={cn(
            "size-5 text-fg-3 transition-transform duration-300",
            noDueOpen && "rotate-90",
          )}
        />
      </button>
      {noDueOpen && (
        <div className="mt-2.5 flex flex-col gap-2.5">
          {noDue.map(renderCard)}
        </div>
      )}
    </div>
  );
}
