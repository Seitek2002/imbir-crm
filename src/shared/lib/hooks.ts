import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

/* ── Медиа-запросы ─────────────────────────────────────────────────────── */

function subscribeMedia(query: string) {
  return (cb: () => void) => {
    const mql = window.matchMedia(query);
    mql.addEventListener("change", cb);
    return () => mql.removeEventListener("change", cb);
  };
}

export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    subscribeMedia(query),
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export const DESKTOP_QUERY = "(min-width: 1024px)";

/** Десктопная раскладка: боковая панель + список + детальная панель */
export function useIsDesktop() {
  return useMediaQuery(DESKTOP_QUERY);
}

export function isDesktopNow() {
  return (
    typeof window !== "undefined" && window.matchMedia(DESKTOP_QUERY).matches
  );
}

export function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/* ── Высота видимой области (учитывает экранную клавиатуру iOS) ────────── */

export function useAppHeight() {
  useEffect(() => {
    const vv = window.visualViewport;
    const update = () => {
      const h = vv ? vv.height : window.innerHeight;
      document.documentElement.style.setProperty(
        "--app-height",
        `${Math.round(h)}px`,
      );
      // iOS при фокусе на поле прокручивает весь документ — возвращаем на место
      if (window.scrollY !== 0) window.scrollTo(0, 0);
    };
    update();
    vv?.addEventListener("resize", update);
    vv?.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    return () => {
      vv?.removeEventListener("resize", update);
      vv?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);
}

/* ── Долгое нажатие (контекстное меню на тач-устройствах) ──────────────── */

type LongPressOptions = {
  delay?: number;
  disabled?: boolean;
  onLongPress: (e: {
    clientX: number;
    clientY: number;
    target: EventTarget | null;
  }) => void;
};

/**
 * Меню открывается под пальцем, и клик, который браузер синтезирует при его
 * отпускании, попал бы в пункт меню. Отмена touchend не даёт этому клику родиться.
 */
function swallowRelease() {
  const done = () => {
    window.removeEventListener("touchend", onEnd, true);
    window.removeEventListener("touchcancel", done, true);
  };
  const onEnd = (e: TouchEvent) => {
    if (e.cancelable) e.preventDefault();
    done();
  };
  window.addEventListener("touchend", onEnd, { capture: true, passive: false });
  window.addEventListener("touchcancel", done, true);
}

export function useLongPress({
  onLongPress,
  delay = 450,
  disabled,
}: LongPressOptions) {
  const timer = useRef<null | number>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const fired = useRef(false);

  const clear = useCallback(() => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
    start.current = null;
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      fired.current = false;
      if (disabled || e.pointerType === "mouse") return;
      start.current = { x: e.clientX, y: e.clientY };
      const { clientX, clientY, target } = e;
      timer.current = window.setTimeout(() => {
        fired.current = true;
        swallowRelease();
        onLongPress({ clientX, clientY, target });
        clear();
      }, delay);
    },
    [clear, delay, disabled, onLongPress],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!start.current) return;
      if (
        Math.hypot(e.clientX - start.current.x, e.clientY - start.current.y) > 8
      )
        clear();
    },
    [clear],
  );

  const onContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if (disabled) return;
      e.preventDefault();
      if (fired.current) return;
      // Android может прислать contextmenu раньше нашего таймера
      if (start.current) {
        fired.current = true;
        swallowRelease();
        clear();
      }
      onLongPress({ clientX: e.clientX, clientY: e.clientY, target: e.target });
    },
    [clear, disabled, onLongPress],
  );

  /** Клик после долгого нажатия не должен срабатывать */
  const onClickCapture = useCallback((e: React.MouseEvent) => {
    if (fired.current) {
      e.preventDefault();
      e.stopPropagation();
      fired.current = false;
    }
  }, []);

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp: clear,
    onPointerCancel: clear,
    onPointerLeave: clear,
    onContextMenu,
    onClickCapture,
  };
}

/* ── Восстановление скролла при возврате на экран ──────────────────────── */

const scrollPositions = new Map<string, number>();

export function useScrollRestore<T extends HTMLElement>(key: string) {
  const ref = useRef<T>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const saved = scrollPositions.get(key);
    if (saved != null) el.scrollTop = saved;
    const onScroll = () => scrollPositions.set(key, el.scrollTop);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [key]);

  return ref;
}

/* ── Прочее ────────────────────────────────────────────────────────────── */

export function useDebounced<T>(value: T, delay = 250) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/**
 * Держит компонент смонтированным на время анимации закрытия.
 * Пока open=true — state "open"; после закрытия ещё duration мс state "closed".
 */
export function usePresence(open: boolean, duration = 200) {
  const [lingering, setLingering] = useState(open);
  const [prevOpen, setPrevOpen] = useState(open);

  // Производное состояние «во время рендера» вместо setState в эффекте
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setLingering(true);
  }

  useEffect(() => {
    if (open || !lingering) return;
    const t = window.setTimeout(() => setLingering(false), duration);
    return () => window.clearTimeout(t);
  }, [open, lingering, duration]);

  return {
    mounted: open || lingering,
    state: (open ? "open" : "closed") as "closed" | "open",
  };
}

/** Последнее «непустое» значение — чтобы показывать контент во время анимации закрытия */
export function useLastDefined<T>(value: null | T | undefined): null | T {
  const [last, setLast] = useState<null | T>(value ?? null);
  if (value != null && value !== last) setLast(value);
  return value ?? last;
}

/** Ctrl/Cmd + key */
export function useHotkey(
  key: string,
  handler: (e: KeyboardEvent) => void,
  opts: { enabled?: boolean; mod?: boolean } = {},
) {
  const { mod = true, enabled = true } = opts;
  const saved = useRef(handler);
  useLayoutEffect(() => {
    saved.current = handler;
  });
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (mod && !(e.ctrlKey || e.metaKey)) return;
      if (e.key.toLowerCase() !== key.toLowerCase()) return;
      saved.current(e);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [key, mod, enabled]);
}
