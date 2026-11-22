import { type Language, useSettings } from "@/shared/model/settings";

import { en } from "./en";
import { type Dict, ru } from "./ru";

const dicts: Record<Language, Dict> = { ru, en };

/** Словарь текущего языка. Компонент перерисуется при смене языка. */
export function useT(): Dict {
  const lang = useSettings((s) => s.language);
  return dicts[lang];
}

/** Для кода вне React (уведомления, тосты из мутаций) */
export function getT(): Dict {
  return dicts[useSettings.getState().language];
}

export function getLocale() {
  return useSettings.getState().language === "en" ? "en-US" : "ru-RU";
}

export type { Dict };
export { pluralRu } from "./plural";
