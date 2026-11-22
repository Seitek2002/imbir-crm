/** «Асель — помощница Эрлана» → «Асель» (для подписей «Асель печатает…») */
export function firstName(name: string) {
  return name.split(/\s[—–-]\s|\s/)[0] || name;
}

/** Цвет имени автора в групповом чате: стабильный для одного id */
const NAME_COLORS = [
  "#fc246c",
  "#6c42fc",
  "#18a0a0",
  "#3c7efc",
  "#e07400",
  "#06a06a",
  "#d14b8f",
];

export function nameColor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return NAME_COLORS[Math.abs(h) % NAME_COLORS.length];
}
