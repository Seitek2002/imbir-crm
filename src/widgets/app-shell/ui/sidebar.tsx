import { useLocation, useNavigate } from "react-router";

import {
  Bell,
  CircleCheck,
  MessagesSquare,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  Sun,
} from "lucide-react";

import { usePalette } from "@/features/global-search";

import { UserAvatar, useMe } from "@/entities/user";

import { BRAND } from "@/shared/config";
import { cn, useT } from "@/shared/lib";
import { resolveDark, useSettings } from "@/shared/model";
import { CountBadge, Kbd, Logo, MOD_KEY } from "@/shared/ui";

import { NAV_ROOTS, type NavKey, activeSection } from "../config/nav";
import { useNavBadges } from "../lib/use-badges";

// Профиль открывается по плашке с аватаркой внизу, отдельного пункта нет
type RailKey = Exclude<NavKey, "profile">;

const ICONS: Record<RailKey, React.ReactNode> = {
  chats: <MessagesSquare />,
  tasks: <CircleCheck />,
  notifications: <Bell />,
};

const RAIL_ITEMS = NAV_ROOTS.filter(
  (r): r is { key: RailKey; path: string } => r.key !== "profile",
);

/**
 * Боковая панель десктопа. Разворачивается с подписями разделов,
 * в свёрнутом виде подписи показываются подсказками.
 */
export function Sidebar() {
  const t = useT();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const active = activeSection(pathname);
  const badges = useNavBadges();
  const expanded = useSettings((s) => s.sidebarExpanded);
  const toggle = useSettings((s) => s.toggleSidebar);
  const theme = useSettings((s) => s.theme);
  const setTheme = useSettings((s) => s.setTheme);
  const openPalette = usePalette((s) => s.setOpen);
  const { data: me } = useMe();
  const dark = resolveDark(theme);

  const labels: Record<RailKey, string> = {
    chats: t.nav.chats,
    tasks: t.nav.tasks,
    notifications: t.nav.notifications,
  };
  const profileActive = active === "profile";

  const item = (
    key: string,
    icon: React.ReactNode,
    label: string,
    onClick: () => void,
    opts: { active?: boolean; badge?: number; trailing?: React.ReactNode } = {},
  ) => (
    <button
      key={key}
      type="button"
      onClick={onClick}
      className={cn(
        "group/item relative flex h-11 w-full items-center gap-3 rounded-xl px-[0.8rem] text-left text-[0.9375rem] font-medium transition-colors duration-150",
        opts.active
          ? "bg-primary/15 text-white"
          : "text-white/60 hover:bg-white/[0.06] hover:text-white",
      )}
    >
      <span
        className={cn(
          "relative shrink-0 transition-colors [&_svg]:size-[1.3rem]",
          opts.active ? "text-primary" : "",
        )}
      >
        {icon}
        {!!opts.badge && !expanded && (
          <CountBadge
            count={opts.badge}
            className="absolute -right-2.5 -top-2 h-4 min-w-4 px-1 text-[0.625rem]"
          />
        )}
      </span>
      <span
        className={cn(
          "min-w-0 flex-1 truncate transition-opacity duration-200",
          expanded ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        {label}
      </span>
      {expanded && opts.trailing}
      {expanded && !!opts.badge && <CountBadge count={opts.badge} />}
      {opts.active && (
        <span className="absolute -left-3 top-2 h-7 w-1 rounded-r-full bg-primary" />
      )}
      {/* Подсказка у свёрнутой панели */}
      {!expanded && (
        <span className="pointer-events-none absolute left-full z-50 ml-3 whitespace-nowrap rounded-lg bg-[#2a2d38] px-2.5 py-1.5 text-[0.8125rem] text-white opacity-0 shadow-float transition-all duration-150 group-hover/item:translate-x-0 group-hover/item:opacity-100 -translate-x-1">
          {label}
        </span>
      )}
    </button>
  );

  return (
    <aside
      className={cn(
        "relative z-30 flex h-full shrink-0 flex-col bg-rail px-3 py-4 transition-[width] duration-300 ease-out-expo",
        expanded ? "w-[15rem]" : "w-[4.5rem]",
      )}
    >
      <div className="mb-5 flex items-center gap-3 px-1">
        <Logo size={2.5} className="shrink-0" />
        <div
          className={cn(
            "min-w-0 transition-opacity duration-200",
            expanded ? "opacity-100" : "opacity-0",
          )}
        >
          <div className="truncate text-[0.9375rem] font-bold text-white">
            {BRAND.name}
          </div>
          <div className="truncate text-[0.6875rem] text-white/45">
            {BRAND.company}
          </div>
        </div>
      </div>

      {item("search", <Search />, t.nav.search, () => openPalette(true), {
        trailing: (
          <span className="flex gap-0.5 opacity-70">
            <Kbd className="border-white/10 bg-white/10 text-white/70">
              {MOD_KEY}
            </Kbd>
            <Kbd className="border-white/10 bg-white/10 text-white/70">K</Kbd>
          </span>
        ),
      })}
      {item("new-task", <Plus />, t.nav.newTask, () => navigate("/tasks/new"))}

      <div className="my-3 h-px bg-white/[0.07]" />

      <nav className="flex flex-col gap-1">
        {RAIL_ITEMS.map((r) =>
          item(r.key, ICONS[r.key], labels[r.key], () => navigate(r.path), {
            active: r.key === active,
            badge: badges[r.key],
          }),
        )}
      </nav>

      <div className="mt-auto flex flex-col gap-1">
        {item(
          "theme",
          dark ? <Sun /> : <Moon />,
          t.profile.themes[dark ? "light" : "dark"],
          () => setTheme(dark ? "light" : "dark"),
        )}
        {item(
          "collapse",
          expanded ? <PanelLeftClose /> : <PanelLeftOpen />,
          expanded ? t.nav.collapse : t.nav.expand,
          toggle,
        )}
        <button
          type="button"
          onClick={() => navigate("/profile")}
          aria-label={t.nav.profile}
          aria-current={profileActive ? "page" : undefined}
          className={cn(
            "group/item relative mt-2 flex items-center gap-3 rounded-xl p-1.5 text-left transition-colors",
            profileActive ? "bg-primary/15" : "hover:bg-white/[0.06]",
          )}
        >
          {profileActive && (
            <span className="absolute -left-3 top-2.5 h-7 w-1 rounded-r-full bg-primary" />
          )}
          <UserAvatar user={me} size={2.25} withPresence />
          {!expanded && (
            <span className="pointer-events-none absolute left-full z-50 ml-3 -translate-x-1 whitespace-nowrap rounded-lg bg-[#2a2d38] px-2.5 py-1.5 text-[0.8125rem] text-white opacity-0 shadow-float transition-all duration-150 group-hover/item:translate-x-0 group-hover/item:opacity-100">
              {t.nav.profile}
            </span>
          )}
          <span
            className={cn(
              "min-w-0 transition-opacity",
              expanded ? "opacity-100" : "opacity-0",
            )}
          >
            <span className="block truncate text-[0.875rem] font-semibold text-white">
              {me?.name}
            </span>
            <span className="block truncate text-[0.75rem] text-white/45">
              {me?.email}
            </span>
          </span>
        </button>
      </div>
    </aside>
  );
}
