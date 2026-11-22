import { useIsDesktop, useT } from "@/shared/lib";
import { BackButton, NavBar, Screen, ScrollArea } from "@/shared/ui";

import { DepartmentsList } from "./departments-list";

export function ProfileDepartmentsPage() {
  const t = useT();
  const isDesktop = useIsDesktop();
  return (
    <Screen>
      <NavBar
        title={t.profile.departments}
        left={!isDesktop && <BackButton fallback="/profile" />}
      />
      <ScrollArea className="pb-10 pt-2">
        <div className="mx-auto max-w-lg animate-fade-up">
          <DepartmentsList />
        </div>
      </ScrollArea>
    </Screen>
  );
}
