export type HapticKind = "error" | "heavy" | "light" | "medium" | "success";

const PATTERN: Record<HapticKind, number | number[]> = {
  light: 8,
  medium: 14,
  heavy: 24,
  success: [10, 40, 14],
  error: [20, 40, 20, 40, 20],
};

const WEIGHT: Record<HapticKind, number> = {
  light: 0,
  medium: 1,
  heavy: 2,
  success: 2,
  error: 2,
};

/** Касание и вызванный им переход приходят почти одновременно — это один отклик */
const MERGE_MS = 80;
let last = { at: -Infinity, weight: -1 };

/**
 * iOS Safari не поддерживает Vibration API, но с iOS 18 переключение
 * системного <input switch> даёт тактильный «тик». Нажимаем невидимый
 * переключатель программно — работает внутри пользовательского жеста.
 */
function iosTick() {
  const label = document.createElement("label");
  label.ariaHidden = "true";
  label.style.display = "none";
  const input = document.createElement("input");
  input.type = "checkbox";
  input.setAttribute("switch", "");
  label.appendChild(input);
  document.head.appendChild(label);
  label.click();
  label.remove();
}

/** Тактильный отклик: Android — вибрация, iPhone (iOS 18+) — системный тик, десктоп — ничего */
export function haptic(kind: HapticKind = "light") {
  if (typeof navigator === "undefined") return;
  // До первого касания страницы браузер вибрацию всё равно блокирует (и пишет
  // ошибку в консоль) — например, при редиректе на экран входа при загрузке
  if (navigator.userActivation && !navigator.userActivation.hasBeenActive)
    return;
  const now = performance.now();
  const weight = WEIGHT[kind];
  if (now - last.at < MERGE_MS && weight <= last.weight) return;
  last = { at: now, weight };
  try {
    if ("vibrate" in navigator) navigator.vibrate(PATTERN[kind]);
    else if (window.matchMedia("(pointer: coarse)").matches) iosTick();
  } catch {
    /* браузер может запретить вибрацию без жеста пользователя */
  }
}

const TAPPABLE =
  'button, [role="button"], [role="tab"], [role="switch"], [role="menuitem"], a[href]';

/**
 * Лёгкий отклик на нажатие любой кнопки. Слушаем click, а не pointerdown:
 * если палец начал прокрутку списка, клика не будет — и вибрации тоже.
 * Возвращает функцию отписки.
 */
export function installTapHaptics() {
  const onClick = (e: MouseEvent) => {
    const el = (e.target as Element | null)?.closest?.(TAPPABLE);
    if (!el || el.matches(":disabled, [aria-disabled='true']")) return;
    haptic("light");
  };
  document.addEventListener("click", onClick, true);
  return () => document.removeEventListener("click", onClick, true);
}
