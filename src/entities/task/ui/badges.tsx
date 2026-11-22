import type { TaskPriority, TaskStatus } from "@/shared/api";
import { useT } from "@/shared/lib";
import { Chip } from "@/shared/ui";

import { PRIORITY_COLOR, STATUS_COLOR } from "../config/meta";

export function StatusChip({
  status,
  onClick,
}: {
  onClick?: () => void;
  status: TaskStatus;
}) {
  const t = useT();
  return (
    <Chip color={STATUS_COLOR[status]} onClick={onClick}>
      {t.tasks.statuses[status]}
    </Chip>
  );
}

export function PriorityBadge({
  priority,
  onClick,
}: {
  onClick?: () => void;
  priority: TaskPriority;
}) {
  const t = useT();
  return (
    <Chip
      color={PRIORITY_COLOR[priority]}
      onClick={onClick}
      className="rounded-full px-2.5"
    >
      {t.tasks.priorities[priority]}
    </Chip>
  );
}
