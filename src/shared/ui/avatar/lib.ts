/** «Асель — помощница Эрлана» → «АП», «Test» → «T» */
export function getInitials(name: string) {
  const words = name
    .replace(/[—–-]/g, " ")
    .split(/\s+/)
    .filter((w) => /[\p{L}\p{N}]/u.test(w));
  if (!words.length) return "?";
  if (words.length === 1) return words[0].slice(0, 1).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}
