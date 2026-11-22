import fsd from "@feature-sliced/steiger-plugin";
import { defineConfig } from "steiger";

export default defineConfig([
  ...fsd.configs.recommended,
  {
    // В assets публичные API держим раздельно (как в imbir-nextjs):
    // импорт через под-сегмент самодокументирует, как использовать ассет.
    files: ["./src/shared/assets/**"],
    rules: {
      "fsd/public-api": "off",
      "fsd/no-public-api-sidestep": "off",
    },
  },
]);
