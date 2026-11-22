import { useState } from "react";

import { Circle, CircleMinus, Monitor, Moon, Sun } from "lucide-react";

import { useMe, useUpdateMe } from "@/entities/user";

import type { Presence } from "@/shared/api";
import { haptic, useT } from "@/shared/lib";
import { type Language, type ThemeMode, useSettings } from "@/shared/model";
import { ActionSheet } from "@/shared/ui";

type Kind = "language" | "presence" | "theme";

/** Выбор темы, языка и статуса — iOS action sheet / меню на десктопе */
export function useSettingsSheets() {
  const t = useT();
  const [open, setOpen] = useState<Kind | null>(null);
  const theme = useSettings((s) => s.theme);
  const setTheme = useSettings((s) => s.setTheme);
  const language = useSettings((s) => s.language);
  const setLanguage = useSettings((s) => s.setLanguage);
  const { data: me } = useMe();
  const updateMe = useUpdateMe();

  const themes: { icon: React.ReactNode; value: ThemeMode }[] = [
    { value: "light", icon: <Sun /> },
    { value: "dark", icon: <Moon /> },
    { value: "system", icon: <Monitor /> },
  ];
  const languages: Language[] = ["ru", "en"];
  const presences: { icon: React.ReactNode; value: Presence }[] = [
    { value: "online", icon: <Circle className="fill-success text-success" /> },
    { value: "offline", icon: <Circle className="text-fg-3" /> },
    { value: "dnd", icon: <CircleMinus className="text-danger" /> },
  ];

  const element = (
    <>
      <ActionSheet
        open={open === "theme"}
        onClose={() => setOpen(null)}
        title={t.profile.theme}
        cancelLabel={t.common.cancel}
        options={themes.map((o) => ({
          label: t.profile.themes[o.value],
          icon: o.icon,
          selected: theme === o.value,
          onSelect: () => {
            haptic("light");
            setTheme(o.value);
          },
        }))}
      />
      <ActionSheet
        open={open === "language"}
        onClose={() => setOpen(null)}
        title={t.profile.language}
        cancelLabel={t.common.cancel}
        options={languages.map((l) => ({
          label: t.profile.languages[l],
          selected: language === l,
          onSelect: () => setLanguage(l),
        }))}
      />
      <ActionSheet
        open={open === "presence"}
        onClose={() => setOpen(null)}
        title={t.profile.status}
        cancelLabel={t.common.cancel}
        options={presences.map((o) => ({
          label: t.profile.statuses[o.value],
          icon: o.icon,
          selected: me?.presence === o.value,
          onSelect: () => updateMe.mutate({ presence: o.value }),
        }))}
      />
    </>
  );

  return { open: setOpen, element };
}
