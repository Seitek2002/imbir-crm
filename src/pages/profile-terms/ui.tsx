import { useIsDesktop, useT } from "@/shared/lib";
import {
  BackButton,
  NavBar,
  Screen,
  ScrollArea,
  TermsContent,
} from "@/shared/ui";

export function ProfileTermsPage() {
  const t = useT();
  const isDesktop = useIsDesktop();
  return (
    <Screen tone="plain">
      <NavBar
        title={t.terms.title}
        variant="glass"
        left={!isDesktop && <BackButton fallback="/profile" />}
      />
      <ScrollArea className="px-5 pt-3 lg:px-8">
        <div className="mx-auto max-w-2xl animate-fade-up">
          <TermsContent />
        </div>
      </ScrollArea>
    </Screen>
  );
}
