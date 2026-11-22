/** Клавиша-модификатор для подсказок: ⌘ на Mac/iOS, Ctrl — на остальных */
export const MOD_KEY =
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform)
    ? "⌘"
    : "Ctrl";
