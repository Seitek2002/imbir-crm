import { useState } from "react";

import { Check } from "lucide-react";

import {
  PRIORITIES,
  PRIORITY_COLOR,
  STATUSES,
  STATUS_COLOR,
} from "@/entities/task";

import type { TaskPriority, TaskStatus } from "@/shared/api";
import { cn, haptic, useT } from "@/shared/lib";
import { Button, Modal, Segmented, Toggle } from "@/shared/ui";

import { useTaskFilters } from "../model/filters";

function Pill({
  on,
  color,
  label,
  onClick,
}: {
  color: string;
  label: string;
  on: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        haptic("light");
        onClick();
      }}
      className={cn(
        "pressable inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-[0.9375rem] font-medium transition-colors",
        on
          ? "border-transparent text-white"
          : "border-separator bg-surface text-fg",
      )}
      style={on ? { background: color } : undefined}
    >
      {on ? (
        <Check className="size-4" strokeWidth={3} />
      ) : (
        <span className="size-2.5 rounded-full" style={{ background: color }} />
      )}
      {label}
    </button>
  );
}

export function TaskFiltersSheet({
  open,
  onClose,
}: {
  onClose: () => void;
  open: boolean;
}) {
  const t = useT();
  const store = useTaskFilters();
  const [statuses, setStatuses] = useState<TaskStatus[]>(store.statuses);
  const [priorities, setPriorities] = useState<TaskPriority[]>(
    store.priorities,
  );
  const [hideDone, setHideDone] = useState(store.hideDone);
  const [wasOpen, setWasOpen] = useState(open);

  // При каждом открытии черновик фильтров берётся из сохранённых
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setStatuses(store.statuses);
      setPriorities(store.priorities);
      setHideDone(store.hideDone);
    }
  }

  const toggle = <T,>(list: T[], v: T) =>
    list.includes(v) ? list.filter((x) => x !== v) : [...list, v];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t.tasks.filters}
      headerRight={
        <button
          type="button"
          onClick={() => {
            setStatuses([]);
            setPriorities([]);
            setHideDone(false);
          }}
          className="text-[0.9375rem] font-medium text-primary"
        >
          {t.tasks.reset}
        </button>
      }
    >
      <div className="flex flex-col gap-5 pb-2">
        <Segmented
          value={store.scope}
          onChange={store.setScope}
          options={[
            { value: "mine", label: t.tasks.scopeMine },
            { value: "created", label: t.tasks.scopeCreated },
            { value: "all", label: t.tasks.scopeAll },
          ]}
        />
        <div>
          <div className="mb-2 text-[0.8125rem] font-medium uppercase tracking-wide text-fg-2">
            {t.tasks.status}
          </div>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((s) => (
              <Pill
                key={s}
                on={statuses.includes(s)}
                color={STATUS_COLOR[s]}
                label={t.tasks.statuses[s]}
                onClick={() => setStatuses(toggle(statuses, s))}
              />
            ))}
          </div>
        </div>
        <div>
          <div className="mb-2 text-[0.8125rem] font-medium uppercase tracking-wide text-fg-2">
            {t.tasks.priority}
          </div>
          <div className="flex flex-wrap gap-2">
            {PRIORITIES.map((p) => (
              <Pill
                key={p}
                on={priorities.includes(p)}
                color={PRIORITY_COLOR[p]}
                label={t.tasks.priorities[p]}
                onClick={() => setPriorities(toggle(priorities, p))}
              />
            ))}
          </div>
        </div>
        <label className="flex items-center justify-between rounded-2xl bg-surface-2 px-4 py-3">
          <span className="text-[1rem]">{t.tasks.hideDone}</span>
          <Toggle checked={hideDone} onChange={setHideDone} />
        </label>
        <Button
          block
          onClick={() => {
            store.apply({ statuses, priorities, hideDone });
            onClose();
          }}
        >
          {t.tasks.apply}
        </Button>
      </div>
    </Modal>
  );
}
