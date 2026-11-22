/** Фоны статусов — ключ хранится на «сервере», градиент рисует клиент */
export const STORY_BACKGROUNDS: Record<string, string> = {
  sunset: "linear-gradient(160deg,#ff5f8f 0%,#fc246c 45%,#fc8400 100%)",
  mint: "linear-gradient(160deg,#4be1b6 0%,#06ae72 55%,#0b7d63 100%)",
  violet: "linear-gradient(160deg,#9b7bff 0%,#6c42fc 55%,#3d1fb8 100%)",
  ocean: "linear-gradient(160deg,#56c8ff 0%,#3c7efc 55%,#1f3fb8 100%)",
  peach: "linear-gradient(160deg,#ffd29e 0%,#ff9a6b 55%,#fc5a5a 100%)",
  night: "linear-gradient(160deg,#3a4256 0%,#1c2131 60%,#0c0f18 100%)",
};

export const STORY_BG_KEYS = Object.keys(STORY_BACKGROUNDS);
