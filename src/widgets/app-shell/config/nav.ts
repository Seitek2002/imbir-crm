export type NavKey = "chats" | "notifications" | "profile" | "tasks";

export const NAV_ROOTS: { key: NavKey; path: string }[] = [
  { key: "chats", path: "/chats" },
  { key: "tasks", path: "/tasks" },
  { key: "notifications", path: "/notifications" },
  { key: "profile", path: "/profile" },
];

/** Корневые экраны вкладок — на них показывается таб-бар */
export function isTabRoot(pathname: string) {
  return NAV_ROOTS.some((r) => r.path === pathname.replace(/\/$/, ""));
}

export function activeSection(pathname: string): NavKey | null {
  return (
    NAV_ROOTS.find(
      (r) => pathname === r.path || pathname.startsWith(`${r.path}/`),
    )?.key ?? null
  );
}
