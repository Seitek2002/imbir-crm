import { useState } from "react";
import { useLocation, useNavigate } from "react-router";

import {
  BellRing,
  BriefcaseBusiness,
  CircleDot,
  FileText,
  Globe,
  Info,
  Palette,
  QrCode,
  ScanFace,
} from "lucide-react";

import { useSettingsSheets } from "@/features/app-settings";
import { useTaskFilters } from "@/features/task-filters";

import { UserAvatar, useMe } from "@/entities/user";

import { cn, haptic, useIsDesktop, useScrollRestore, useT } from "@/shared/lib";
import { useSettings } from "@/shared/model";
import {
  IconButton,
  ListGroup,
  ListRow,
  NavPillButton,
  Skeleton,
  Toggle,
} from "@/shared/ui";

import { LogoutButton } from "./logout-button";
import { QrSheet } from "./qr-sheet";

const PRESENCE_COLOR = {
  online: "#06ae72",
  offline: "#8e8e93",
  dnd: "#fc302a",
} as const;

export function ProfilePanel() {
  const t = useT();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isDesktop = useIsDesktop();
  const { data: me } = useMe();
  const theme = useSettings((s) => s.theme);
  const language = useSettings((s) => s.language);
  const appLock = useSettings((s) => s.appLock);
  const setAppLock = useSettings((s) => s.setAppLock);
  const setScope = useTaskFilters((s) => s.setScope);
  const sheets = useSettingsSheets();
  const [qrOpen, setQrOpen] = useState(false);
  const [compact, setCompact] = useState(false);
  const scrollRef = useScrollRestore<HTMLDivElement>("profile");

  const go = (path: string) =>
    navigate(path, { replace: isDesktop && pathname !== "/profile" });
  const sel = (path: string) => isDesktop && pathname === path;

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-bg lg:bg-surface-2/40">
      <header className="relative z-20 shrink-0 pt-safe">
        <div className="relative flex h-[3.375rem] items-center justify-between px-3 lg:h-14">
          <IconButton
            label={t.profile.qr}
            variant="glass"
            onClick={() => setQrOpen(true)}
          >
            <QrCode className="text-fg" />
          </IconButton>
          <div
            className={cn(
              "absolute left-1/2 flex -translate-x-1/2 items-center gap-2 transition-all duration-300 ease-out-expo",
              compact ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
            )}
          >
            <UserAvatar user={me} size={1.75} />
            <span className="max-w-40 truncate text-[1.0625rem] font-semibold">
              {me?.name}
            </span>
          </div>
          <NavPillButton
            onClick={() => go("/profile/account")}
            active={sel("/profile/account")}
          >
            {t.common.edit}
          </NavPillButton>
        </div>
      </header>

      <div
        ref={scrollRef}
        data-tab-scroll
        onScroll={(e) => setCompact((e.target as HTMLElement).scrollTop > 130)}
        className="scroll-area min-h-0 flex-1 pb-32 lg:pb-8"
      >
        <div
          className={cn(
            "flex flex-col items-center px-6 pb-5 pt-2 text-center transition-all duration-300",
            compact && "scale-95 opacity-0",
          )}
        >
          {me ? (
            <>
              <button
                type="button"
                onClick={() => go("/profile/account")}
                className="pressable rounded-full"
              >
                <UserAvatar user={me} size={6} withPresence />
              </button>
              <h1 className="mt-3 text-[1.625rem] font-bold leading-tight">
                {me.name}
              </h1>
              <p className="text-[0.9375rem] text-fg-2">{me.email}</p>
            </>
          ) : (
            <>
              <Skeleton className="size-24 rounded-full" />
              <Skeleton className="mt-3 h-6 w-40" />
            </>
          )}
        </div>

        <div className="mx-4 mb-5 grid grid-cols-2 gap-3">
          {[
            { n: me?.stats.open, label: t.profile.open, color: "text-primary" },
            { n: me?.stats.done, label: t.profile.done, color: "text-primary" },
          ].map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => {
                setScope("mine");
                navigate("/tasks", { replace: true });
              }}
              className="pressable rounded-2xl bg-surface p-4 text-left shadow-[0_1px_2px_rgb(0_0_0/0.04)]"
            >
              <div
                key={s.n}
                className={cn(
                  "animate-pop-in text-[1.875rem] font-bold leading-none",
                  s.color,
                )}
              >
                {s.n ?? "–"}
              </div>
              <div className="mt-2 text-[0.8125rem] text-fg-2">{s.label}</div>
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-5">
          <ListGroup>
            <ListRow
              icon={<BriefcaseBusiness />}
              iconColor="#fc246c"
              title={t.profile.role}
              value={me ? t.profile.roles[me.role] : ""}
            />
          </ListGroup>

          <ListGroup>
            <ListRow
              icon={<ScanFace />}
              iconColor="#fc3d5f"
              title={t.profile.lock}
              subtitle={t.profile.lockHint}
              trailing={
                <Toggle
                  checked={appLock}
                  onChange={(v) => {
                    haptic(v ? "success" : "light");
                    setAppLock(v);
                  }}
                  label={t.profile.lock}
                />
              }
            />
          </ListGroup>

          <ListGroup>
            <ListRow
              icon={<BellRing />}
              iconColor="#18baba"
              title={t.profile.departments}
              value={t.profile.departmentsOff(
                me?.mutedDepartmentIds.length ?? 0,
              )}
              chevron
              selected={sel("/profile/departments")}
              onClick={() => go("/profile/departments")}
            />
          </ListGroup>

          <ListGroup>
            <ListRow
              icon={<Globe />}
              iconColor="#5856d6"
              title={t.profile.language}
              value={t.profile.languages[language]}
              chevron
              onClick={() => sheets.open("language")}
            />
            <ListRow
              icon={<Palette />}
              iconColor="#8e8e93"
              title={t.profile.theme}
              value={t.profile.themes[theme]}
              chevron
              onClick={() => sheets.open("theme")}
            />
            <ListRow
              icon={<CircleDot />}
              iconColor={me ? PRESENCE_COLOR[me.presence] : "#06ae72"}
              title={t.profile.status}
              value={me ? t.profile.statuses[me.presence] : ""}
              chevron
              onClick={() => sheets.open("presence")}
            />
          </ListGroup>

          <ListGroup>
            <ListRow
              icon={<Info />}
              iconColor="#30b0c7"
              title={t.profile.about}
              chevron
              selected={sel("/profile/about")}
              onClick={() => go("/profile/about")}
            />
            <ListRow
              icon={<FileText />}
              iconColor="#5856d6"
              title={t.profile.terms}
              chevron
              selected={sel("/profile/terms")}
              onClick={() => go("/profile/terms")}
            />
          </ListGroup>

          <div className="mx-4">
            <LogoutButton />
          </div>
        </div>
      </div>

      {sheets.element}
      <QrSheet open={qrOpen} onClose={() => setQrOpen(false)} />
    </div>
  );
}
