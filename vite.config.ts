import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { copyFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { type Plugin, defineConfig } from "vite";

// GitHub Pages не знает маршрутов SPA: на любой неизвестный путь он отдаёт 404.html,
// поэтому кладём туда само приложение, иначе ломаются обновление и прямые ссылки.
function spaFallback(): Plugin {
  let outDir = "";
  return {
    name: "spa-fallback",
    apply: "build",
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      copyFileSync(resolve(outDir, "index.html"), resolve(outDir, "404.html"));
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), spaFallback()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  // Пребандлим всё сразу: иначе Vite находит зависимости на лету,
  // пересобирает кэш посреди загрузки и в браузер попадают две копии React
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-dom/client",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "react-router",
      "@tanstack/react-query",
      "zustand",
      "zustand/middleware",
      "lucide-react",
      "qrcode",
      "clsx",
      "tailwind-merge",
    ],
  },
  server: {
    port: 5180,
    host: true,
  },
});
