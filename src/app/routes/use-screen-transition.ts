import { useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { type Location, useLocation, useNavigationType } from "react-router";

import { haptic, isDesktopNow, prefersReducedMotion } from "@/shared/lib";

type Kind = "detail" | "down" | "fade" | "none" | "pop" | "push" | "tab" | "up";

const segments = (p: string) => p.split("/").filter(Boolean);

/** Тип перехода: вглубь/назад по стеку, модальный экран, смена вкладки */
function transitionKind(from: string, to: string, navType: string): Kind {
  if (from === to) return "none";
  const a = segments(from);
  const b = segments(to);
  if (a[0] === "login" || b[0] === "login") return "fade";

  if (isDesktopNow()) {
    if (b[0] === "search" || a[0] === "search") return "fade";
    return a[0] === b[0] ? "detail" : "tab";
  }

  if (b[0] === "search") return "up";
  if (a[0] === "search") return "down";
  if (b.length > a.length) return "push";
  if (b.length < a.length) return "pop";
  if (navType === "POP") return "pop";
  return a.length === 1 ? "tab" : "push";
}

type ViewTransitionLike = {
  finished: Promise<void>;
  ready: Promise<void>;
  skipTransition: () => void;
};
type DocWithVT = Document & {
  startViewTransition?: (cb: () => void) => ViewTransitionLike;
};

/**
 * Возвращает «показываемую» локацию: смена маршрута оборачивается в
 * document.startViewTransition, поэтому старый и новый экраны анимируются
 * одновременно (как UINavigationController), включая жест «назад» браузера.
 */
export function useScreenTransition(): Location {
  const location = useLocation();
  const navType = useNavigationType();
  const [shown, setShown] = useState(location);
  const prevPath = useRef(location.pathname);
  const running = useRef<null | ViewTransitionLike>(null);

  useLayoutEffect(() => {
    if (location === shown) return;
    const from = prevPath.current;
    const to = location.pathname;
    prevPath.current = to;
    // Отклик на смену экрана — в том числе по «Назад» браузера и после редиректов.
    // Если переход вызван нажатием, haptic склеит их в один тик.
    if (from !== to) haptic("light");
    const kind = transitionKind(from, to, navType);
    const doc = document as DocWithVT;

    if (
      kind === "none" ||
      !doc.startViewTransition ||
      prefersReducedMotion() ||
      document.visibilityState !== "visible"
    ) {
      setShown(location);
      return;
    }

    running.current?.skipTransition();
    document.documentElement.dataset.vt = kind;
    const vt = doc.startViewTransition(() => {
      flushSync(() => setShown(location));
    });
    running.current = vt;
    // ready отклоняется, когда переход прерван следующим: это штатная ситуация
    vt.ready.catch(() => undefined);
    vt.finished.finally(() => {
      if (running.current === vt) {
        delete document.documentElement.dataset.vt;
        running.current = null;
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  return shown;
}
