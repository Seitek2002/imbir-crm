import { useEffect } from "react";

import { resolveDark, useSettings } from "@/shared/model";

/** Применяет тему к <html> и красит системную полосу браузера/статус-бар */
export function ThemeSync() {
  const theme = useSettings((s) => s.theme);
  const language = useSettings((s) => s.language);

  useEffect(() => {
    const apply = () => {
      const dark = resolveDark(theme);
      document.documentElement.classList.toggle("dark", dark);
      const color = dark ? "#0c121e" : "#eaeaf0";
      document
        .querySelectorAll('meta[name="theme-color"]')
        .forEach((m) => m.setAttribute("content", color));
    };
    apply();
    if (theme !== "system") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    mql.addEventListener("change", apply);
    return () => mql.removeEventListener("change", apply);
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return null;
}
