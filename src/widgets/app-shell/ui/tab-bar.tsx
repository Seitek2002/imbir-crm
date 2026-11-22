import { useLocation, useNavigate } from "react-router";

import {
  Bell,
  CircleCheck,
  MessagesSquare,
  Search,
  UserRound,
} from "lucide-react";

import { cn, haptic, useT } from "@/shared/lib";
import { CountBadge } from "@/shared/ui";

import { NAV_ROOTS, type NavKey, activeSection } from "../config/nav";
import { useNavBadges } from "../lib/use-badges";

const ICONS: Record<NavKey, React.ReactNode> = {
  chats: <MessagesSquare />,
  tasks: <CircleCheck />,
  notifications: <Bell />,
  profile: <UserRound />,
};

/** Плавающий таб-бар (телефон) — «стеклянная» капсула и круглая кнопка поиска */
export function TabBar({ visible }: { visible: boolean }) {
  const t = useT();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const active = activeSection(pathname);
  const badges = useNavBadges();
  const index = Math.max(
    0,
    NAV_ROOTS.findIndex((r) => r.key === active),
  );

  const labels: Record<NavKey, string> = {
    chats: t.nav.chats,
    tasks: t.nav.tasks,
    notifications: t.nav.notificationsShort,
    profile: t.nav.profile,
  };

  const go = (path: string, key: NavKey) => {
    haptic("light");
    if (key === active) {
      // Повторный тап по вкладке — прокрутка наверх, как в iOS
      document
        .querySelector<HTMLElement>("[data-tab-scroll]")
        ?.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    navigate(path, { replace: true });
  };

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-x-0 bottom-0 z-40 flex items-end justify-center gap-2.5 px-4 pb-[max(0.6rem,env(safe-area-inset-bottom))] transition-all duration-300 ease-ios",
        visible ? "translate-y-0 opacity-100" : "translate-y-[140%] opacity-0",
      )}
      style={{ viewTransitionName: visible ? "tabbar" : undefined }}
    >
      <nav className="pointer-events-auto relative flex rounded-full border border-glass-border bg-glass p-1 shadow-float backdrop-blur-2xl backdrop-saturate-150">
        <span
          aria-hidden
          className="absolute bottom-1 left-1 top-1 w-[4.25rem] rounded-full bg-black/[0.06] transition-transform duration-[420ms] ease-spring dark:bg-white/10"
          style={{ transform: `translateX(${index * 100}%)` }}
        />
        {NAV_ROOTS.map((r) => {
          const on = r.key === active;
          return (
            <button
              key={r.key}
              type="button"
              onClick={() => go(r.path, r.key)}
              className={cn(
                "relative z-10 flex h-[3.25rem] w-[4.25rem] flex-col items-center justify-center gap-0.5 rounded-full transition-colors duration-200 active:scale-95",
                on ? "text-primary" : "text-fg",
              )}
            >
              <span
                className={cn(
                  "relative [&_svg]:size-6 [&_svg]:transition-transform",
                  on && "[&_svg]:scale-105",
                )}
              >
                {ICONS[r.key]}
                {!!badges[r.key] && (
                  <CountBadge
                    count={badges[r.key]!}
                    className="absolute -right-2.5 -top-1.5 h-4 min-w-4 px-1 text-[0.625rem]"
                  />
                )}
              </span>
              <span className="text-[0.625rem] font-semibold">
                {labels[r.key]}
              </span>
            </button>
          );
        })}
      </nav>
      <button
        type="button"
        onClick={() => {
          haptic("light");
          navigate("/search");
        }}
        aria-label={t.nav.search}
        className="pointer-events-auto flex size-[3.75rem] items-center justify-center rounded-full border border-glass-border bg-glass text-fg shadow-float backdrop-blur-2xl transition-transform active:scale-90"
      >
        <Search className="size-6" />
      </button>
    </div>
  );
}
