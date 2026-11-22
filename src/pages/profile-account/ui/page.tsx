import { useIsDesktop, useT } from "@/shared/lib";
import { BackButton, NavBar, Screen, ScrollArea } from "@/shared/ui";

import { AccountForm } from "./account-form";

export function ProfileAccountPage() {
  const t = useT();
  const isDesktop = useIsDesktop();
  return (
    <Screen>
      <NavBar
        title={t.profile.account}
        left={!isDesktop && <BackButton fallback="/profile" />}
      />
      <ScrollArea className="px-4 pb-10 lg:px-6">
        <div className="mx-auto max-w-lg animate-fade-up">
          <AccountForm />
        </div>
      </ScrollArea>
    </Screen>
  );
}
