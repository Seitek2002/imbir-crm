import type { ReactNode } from "react";
import { Outlet, useLocation, useOutlet } from "react-router";

import { CommandPalette } from "@/features/global-search";

import { cn, useIsDesktop } from "@/shared/lib";
import { useSession } from "@/shared/model";

import { isTabRoot } from "../config/nav";
import { Sidebar } from "./sidebar";
import { TabBar } from "./tab-bar";

/** Каркас: телефон — экраны + таб-бар, десктоп — боковая панель + рабочая область */
export function AppShell() {
  const isDesktop = useIsDesktop();
  const { pathname } = useLocation();
  const meId = useSession((s) => s.userId) ?? "";

  if (isDesktop) {
    return (
      <div className="flex h-full w-full overflow-hidden bg-rail">
        <Sidebar />
        <main className="relative min-w-0 flex-1 overflow-hidden rounded-l-[1.25rem] bg-bg">
          <Outlet />
        </main>
        <CommandPalette meId={meId} />
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-bg">
      <Outlet />
      <TabBar visible={isTabRoot(pathname)} />
    </div>
  );
}

type SplitProps = {
  /** Заглушка правой панели, когда ничего не выбрано */
  empty: ReactNode;
  /** Список (левая колонка на десктопе, весь экран на телефоне) */
  list: ReactNode;
  listWidth?: "narrow" | "wide";
};

/**
 * Раздел «список + детали». На телефоне вложенный маршрут открывается
 * отдельным экраном поверх списка, на десктопе — в правой панели.
 */
export function SplitSection({
  list,
  empty,
  listWidth = "narrow",
}: SplitProps) {
  const isDesktop = useIsDesktop();
  const outlet = useOutlet();

  if (!isDesktop) return outlet ?? list;

  return (
    <div className="flex h-full min-h-0">
      <section
        className={cn(
          "relative flex h-full shrink-0 flex-col border-r border-separator bg-surface",
          listWidth === "wide" ? "w-[26rem]" : "w-[23rem]",
        )}
      >
        {list}
      </section>
      <section
        className="relative min-w-0 flex-1"
        style={{ viewTransitionName: "detail" }}
      >
        {outlet ?? empty}
      </section>
    </div>
  );
}
