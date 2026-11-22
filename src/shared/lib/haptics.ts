/** Тактильный отклик там, где он есть (Android/Chrome). На iOS и десктопе — тихо ничего. */
export function haptic(
  kind: "error" | "heavy" | "light" | "medium" | "success" = "light",
) {
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;
  const pattern: Record<typeof kind, number | number[]> = {
    light: 8,
    medium: 14,
    heavy: 24,
    success: [10, 40, 14],
    error: [20, 40, 20, 40, 20],
  };
  try {
    navigator.vibrate(pattern[kind]);
  } catch {
    /* браузер может запретить вибрацию без жеста пользователя */
  }
}
