import { Building2 } from "lucide-react";

import {
  useDepartments,
  useMe,
  useUpdateMutedDepartments,
} from "@/entities/user";

import { useT } from "@/shared/lib";
import { ListGroup, ListRow, SkeletonList, Toggle } from "@/shared/ui";

const COLORS = [
  "#fc246c",
  "#6c42fc",
  "#18baba",
  "#3c7efc",
  "#fc8400",
  "#06ae72",
  "#5856d6",
  "#fc302a",
  "#8e8e93",
  "#d14b8f",
];

/** Переключатели уведомлений по отделам («7 выкл.» в профиле) */
export function DepartmentsList() {
  const t = useT();
  const { data: departments, isLoading } = useDepartments();
  const { data: me } = useMe();
  const update = useUpdateMutedDepartments();
  const muted = me?.mutedDepartmentIds ?? [];

  if (isLoading || !departments)
    return <SkeletonList rows={6} avatar={false} />;

  return (
    <ListGroup footer={t.profile.departmentsHint}>
      {departments.map((d, i) => {
        const on = !muted.includes(d.id);
        return (
          <ListRow
            key={d.id}
            icon={<Building2 />}
            iconColor={COLORS[i % COLORS.length]}
            title={d.name}
            trailing={
              <Toggle
                checked={on}
                label={d.name}
                onChange={(v) =>
                  update.mutate(
                    v ? muted.filter((x) => x !== d.id) : [...muted, d.id],
                  )
                }
              />
            }
          />
        );
      })}
    </ListGroup>
  );
}
