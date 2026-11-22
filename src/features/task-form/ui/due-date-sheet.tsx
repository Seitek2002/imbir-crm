import { useState } from "react";

import { useT } from "@/shared/lib";
import { Button, Modal, MonthCalendar } from "@/shared/ui";

type Props = {
  onChange: (iso: null | string) => void;
  onClose: () => void;
  open: boolean;
  value: null | string;
};

/** Выбор срока: календарь + быстрые варианты */
export function DueDateSheet({ open, value, onClose, onChange }: Props) {
  const t = useT();
  const [month, setMonth] = useState(() =>
    value ? new Date(value) : new Date(),
  );
  const [wasOpen, setWasOpen] = useState(open);

  // Открыли заново — календарь на месяце текущего срока
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setMonth(value ? new Date(value) : new Date());
  }

  const pick = (d: Date) => {
    const x = new Date(d);
    x.setHours(18, 0, 0, 0);
    onChange(x.toISOString());
    onClose();
  };

  const quick = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    pick(d);
  };

  return (
    <Modal open={open} onClose={onClose} title={t.tasks.deadline} size="sm">
      <div className="mb-4 flex gap-2">
        {[
          { label: t.common.today, days: 0 },
          { label: t.common.tomorrow, days: 1 },
          { label: "+7", days: 7 },
        ].map((q) => (
          <button
            key={q.label}
            type="button"
            onClick={() => quick(q.days)}
            className="pressable h-9 flex-1 rounded-full bg-primary-soft text-[0.875rem] font-semibold text-primary"
          >
            {q.label}
          </button>
        ))}
      </div>
      <MonthCalendar
        month={month}
        onMonthChange={setMonth}
        selected={value ? new Date(value) : null}
        onSelect={pick}
        compact
      />
      {value && (
        <Button
          variant="ghost"
          block
          size="md"
          className="mt-3 text-danger"
          onClick={() => {
            onChange(null);
            onClose();
          }}
        >
          {t.tasks.removeDeadline}
        </Button>
      )}
    </Modal>
  );
}
