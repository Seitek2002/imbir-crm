import { getLocale, getT } from "./i18n";

const DAY = 86_400_000;

export function startOfDay(d: Date | number | string) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function isSameDay(a: Date | string, b: Date | string) {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

function daysBetween(a: Date | string, b: Date | string) {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / DAY);
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString(getLocale(), {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** В списке чатов: сегодня — время, на неделе — день недели, раньше — дата */
export function formatChatDate(iso: string) {
  const diff = daysBetween(iso, new Date());
  if (diff === 0) return formatTime(iso);
  if (diff < 7)
    return new Date(iso).toLocaleDateString(getLocale(), { weekday: "short" });
  return new Date(iso).toLocaleDateString(getLocale(), {
    day: "numeric",
    month: "numeric",
  });
}

/** Разделитель дней в чате: «Сегодня», «Вчера», «3 сентября» */
export function formatDayDivider(iso: string) {
  const t = getT();
  const diff = daysBetween(iso, new Date());
  if (diff === 0) return t.common.today;
  if (diff === 1) return t.common.yesterday;
  const d = new Date(iso);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString(getLocale(), {
    day: "numeric",
    month: "long",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

export function formatRelative(iso: string) {
  const t = getT();
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60_000);
  if (min < 1) return t.common.justNow;
  if (min < 60) return t.common.minutesAgo(min);
  const h = Math.floor(min / 60);
  if (h < 24) return t.common.hoursAgo(h);
  const d = Math.floor(h / 24);
  if (d < 7) return t.common.daysAgo(d);
  return formatShortDate(iso);
}

/** «30 окт», «1 Sep» */
export function formatShortDate(iso: string) {
  return new Date(iso)
    .toLocaleDateString(getLocale(), { day: "numeric", month: "short" })
    .replace(".", "");
}

export function formatDue(iso: string) {
  const t = getT();
  const diff = daysBetween(new Date(), iso);
  if (diff === 0) return t.common.today;
  if (diff === 1) return t.common.tomorrow;
  if (diff === -1) return t.common.yesterday;
  return formatShortDate(iso);
}

export function formatDateTime(iso: string) {
  return `${formatShortDate(iso)}, ${formatTime(iso)}`;
}

export function formatMonthYear(d: Date) {
  const s = d.toLocaleDateString(getLocale(), {
    month: "long",
    year: "numeric",
  });
  return s.charAt(0).toUpperCase() + s.slice(1).replace(" г.", "");
}

export function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function formatLastSeen(iso: string) {
  const t = getT();
  const diff = daysBetween(iso, new Date());
  if (diff === 0) return t.chats.lastSeenAt(formatTime(iso));
  if (diff === 1) return t.chats.lastSeenYesterday;
  return t.chats.lastSeenRecently;
}

export function toDateKey(d: Date | string) {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
}
