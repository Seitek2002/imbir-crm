import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { Check, ScanFace } from "lucide-react";

import { BRAND } from "@/shared/config";
import { cn, haptic, usePresence, useT } from "@/shared/lib";
import { useSession, useSettings } from "@/shared/model";
import { Button, Logo } from "@/shared/ui";

import { useAppLock } from "../model/lock";

const BACKGROUND_LOCK_MS = 30_000;

/** Экран блокировки с имитацией Face ID */
export function LockScreen() {
  const t = useT();
  const locked = useAppLock((s) => s.locked);
  const lock = useAppLock((s) => s.lock);
  const unlock = useAppLock((s) => s.unlock);
  const enabled = useSettings((s) => s.appLock);
  const token = useSession((s) => s.token);
  const { mounted, state } = usePresence(locked && Boolean(token), 320);
  const [phase, setPhase] = useState<"idle" | "ok" | "scan">("idle");
  const hiddenAt = useRef<null | number>(null);

  // Ушли в фон надолго — блокируем, как банковские приложения
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") hiddenAt.current = Date.now();
      else if (
        enabled &&
        hiddenAt.current &&
        Date.now() - hiddenAt.current > BACKGROUND_LOCK_MS
      )
        lock();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [enabled, lock]);

  // Заблокировали снова — сканирование начинается с нуля
  const [wasLocked, setWasLocked] = useState(locked);
  if (locked !== wasLocked) {
    setWasLocked(locked);
    if (locked) setPhase("idle");
  }

  if (!mounted) return null;

  const start = () => {
    if (phase !== "idle") return;
    setPhase("scan");
    window.setTimeout(() => {
      setPhase("ok");
      haptic("success");
      window.setTimeout(unlock, 420);
    }, 1100);
  };

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-[200] flex flex-col items-center justify-center bg-bg/80 px-8 backdrop-blur-2xl transition-opacity duration-300",
        state === "closed" && "pointer-events-none opacity-0",
      )}
    >
      <Logo
        size={4}
        className="animate-pop-in shadow-[0_14px_30px_-12px_rgb(252_36_108/0.7)]"
      />
      <h1 className="mt-5 text-xl font-bold">{t.profile.locked(BRAND.name)}</h1>
      <button
        type="button"
        onClick={start}
        className={cn(
          "relative mt-10 flex size-28 items-center justify-center overflow-hidden rounded-[2rem] transition-all duration-300",
          phase === "ok"
            ? "bg-success/15 text-success"
            : "bg-primary-soft text-primary",
        )}
        aria-label={t.profile.unlock}
      >
        {phase === "ok" ? (
          <Check className="size-14 animate-pop-in" strokeWidth={2.4} />
        ) : (
          <ScanFace className="size-16" strokeWidth={1.4} />
        )}
        {phase === "scan" && (
          <span className="absolute inset-x-4 top-1/2 h-0.5 rounded-full bg-primary shadow-[0_0_12px_2px_rgb(252_36_108/0.6)] [animation:faceid-scan_1.1s_ease-in-out_infinite]" />
        )}
      </button>
      <p className="mt-4 h-5 text-[0.9375rem] text-fg-2">
        {phase === "scan" ? t.profile.faceIdLook : ""}
      </p>
      <Button className="mt-8" onClick={start} disabled={phase !== "idle"}>
        {t.profile.unlock}
      </Button>
    </div>,
    document.body,
  );
}
