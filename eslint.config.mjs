import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import perfectionist from "eslint-plugin-perfectionist";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";

// Аналог конфига imbir-nextjs: там базой служит eslint-config-next
// (core-web-vitals + typescript), здесь — те же правила для чистого React на Vite:
// @eslint/js + typescript-eslint + react + react-hooks + react-refresh.
const eslintConfig = defineConfig([
  js.configs.recommended,
  ...tseslint.configs.recommended,
  react.configs.flat.recommended,
  react.configs.flat["jsx-runtime"],
  reactHooks.configs.flat["recommended-latest"],
  reactRefresh.configs.vite,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    settings: { react: { version: "detect" } },
    rules: {
      "react/prop-types": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    plugins: { perfectionist },
    // Только type-level сортировка. Она стирается при компиляции, поэтому на
    // рантайм повлиять не может — единственный риск был бы косметический.
    //
    // sort-imports НЕ включаем: импорты уже расставляет
    // @trivago/prettier-plugin-sort-imports (см. .prettierrc), два
    // сортировщика подрались бы за один и тот же блок.
    //
    // sort-objects тоже не включаем: он трогает вообще все объектные
    // литералы, включая инлайновые в JSX, — это огромный дифф ради мелкой
    // пользы, и там уже есть порядок-зависимые места.
    //
    // Всё на warn: это подсказка при чтении типа, а не повод ронять CI.
    rules: {
      "perfectionist/sort-enums": ["warn", { type: "alphabetical" }],
      "perfectionist/sort-interfaces": ["warn", { type: "alphabetical" }],
      "perfectionist/sort-object-types": ["warn", { type: "alphabetical" }],
      "perfectionist/sort-union-types": ["warn", { type: "alphabetical" }],
    },
  },
  globalIgnores(["dist/**", "node_modules/**", "public/**"]),
]);

export default eslintConfig;
