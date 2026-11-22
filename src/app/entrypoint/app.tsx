import { useEffect } from "react";

import { LockScreen } from "@/features/app-lock";
import { ThemeSync } from "@/features/app-settings";
import { RealtimeBridge } from "@/features/realtime-bridge";

import { useAppHeight } from "@/shared/lib";
import { Toaster } from "@/shared/ui";

import { AppRoutes } from "../routes/router";

/** Поведение «как у приложения»: своё контекстное меню, без системного выделения */
function useNativeFeel() {
  useEffect(() => {
    const onContextMenu = (e: MouseEvent) => {
      const el = e.target as HTMLElement | null;
      if (
        el?.closest(
          'input, textarea, [contenteditable="true"], .selectable, a[href]',
        )
      )
        return;
      e.preventDefault();
    };
    // Перетаскивание картинок и ссылок «из окна» выдаёт веб-страницу
    const onDragStart = (e: DragEvent) => {
      const el = e.target as HTMLElement | null;
      if (el?.tagName === "IMG" || el?.tagName === "A") e.preventDefault();
    };
    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("dragstart", onDragStart);
    return () => {
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("dragstart", onDragStart);
    };
  }, []);
}

export function App() {
  useAppHeight();
  useNativeFeel();
  return (
    <>
      <ThemeSync />
      <AppRoutes />
      <RealtimeBridge />
      <Toaster />
      <LockScreen />
    </>
  );
}
