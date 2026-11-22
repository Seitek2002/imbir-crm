import { useIsDesktop } from "@/shared/lib";

import { LoginForm } from "./login-form";

export function LoginPage() {
  const isDesktop = useIsDesktop();

  if (!isDesktop) {
    return (
      <div className="scroll-area h-full bg-bg">
        <LoginForm />
      </div>
    );
  }

  // Десктоп: форма на «карточке» поверх мягкого фона, как окно настольного приложения
  return (
    <div className="relative flex h-full items-center justify-center overflow-hidden bg-bg">
      <div className="pointer-events-none absolute -left-32 -top-32 size-[32rem] rounded-full bg-primary/20 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-24 size-[30rem] rounded-full bg-purple/20 blur-[120px]" />
      <div className="modal-panel relative max-h-[94vh] w-full max-w-[30rem] overflow-y-auto rounded-[1.75rem] border border-glass-border bg-surface/70 py-4 shadow-float backdrop-blur-xl">
        <LoginForm />
      </div>
    </div>
  );
}
