import { Bell } from "lucide-react";

import { EmptyPane } from "@/widgets/app-shell";

import { useT } from "@/shared/lib";

import { NotificationsPanel } from "./notifications-panel";

export function NotificationsPage() {
  return <NotificationsPanel />;
}

export function NotificationsEmptyPane() {
  const t = useT();
  return (
    <EmptyPane
      icon={<Bell />}
      title={t.notifications.select}
      text={t.notifications.selectHint}
    />
  );
}
