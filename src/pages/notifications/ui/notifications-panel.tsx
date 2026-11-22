import { useMemo } from "react";
import { useNavigate } from "react-router";

import { BellOff } from "lucide-react";

import {
  NotificationRow,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/entities/notification";

import type { NotificationDTO } from "@/shared/api";
import {
  formatDayDivider,
  isSameDay,
  useScrollRestore,
  useT,
} from "@/shared/lib";
import { EmptyState, SectionLabel, SkeletonList } from "@/shared/ui";

export function NotificationsPanel() {
  const t = useT();
  const navigate = useNavigate();
  const { data, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const scrollRef = useScrollRestore<HTMLDivElement>("notifications");
  const unread = data?.filter((n) => !n.read).length ?? 0;

  // Группы по дням: «Сегодня», «Вчера», дата
  const groups = useMemo(() => {
    const out: { items: NotificationDTO[]; label: string }[] = [];
    for (const n of data ?? []) {
      const last = out[out.length - 1];
      if (last && isSameDay(last.items[0].createdAt, n.createdAt))
        last.items.push(n);
      else out.push({ label: formatDayDivider(n.createdAt), items: [n] });
    }
    return out;
  }, [data]);

  const open = (n: NotificationDTO) => {
    if (!n.read) markRead.mutate(n.id);
    navigate(n.link);
  };

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-surface">
      <header className="shrink-0 pt-safe">
        <div className="flex h-[3.375rem] items-center justify-between px-4 lg:h-14">
          <h1 className="text-[1.375rem] font-bold">{t.notifications.title}</h1>
          {unread > 0 && (
            <button
              type="button"
              onClick={() => markAll.mutate()}
              className="animate-fade-in text-[0.9375rem] font-medium text-primary"
            >
              {t.notifications.markAll}
            </button>
          )}
        </div>
      </header>
      <div
        ref={scrollRef}
        data-tab-scroll
        className="scroll-area min-h-0 flex-1 pb-28 lg:pb-4"
      >
        {isLoading ? (
          <SkeletonList rows={7} />
        ) : !data?.length ? (
          <EmptyState
            icon={<BellOff />}
            title={t.notifications.empty}
            text={t.notifications.emptyHint}
          />
        ) : (
          groups.map((g) => (
            <section key={g.label + g.items[0].id}>
              <SectionLabel>{g.label}</SectionLabel>
              {g.items.map((n, i) => (
                <NotificationRow
                  key={n.id}
                  item={n}
                  onClick={() => open(n)}
                  onKeyDown={(e) => e.key === "Enter" && open(n)}
                  className="animate-fade-in"
                  style={{ animationDelay: `${Math.min(i, 8) * 20}ms` }}
                />
              ))}
            </section>
          ))
        )}
      </div>
    </div>
  );
}
