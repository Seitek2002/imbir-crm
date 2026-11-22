let counter = 0;

/** Короткий уникальный id: время + счётчик + случайный хвост */
export function uid(prefix = "") {
  counter = (counter + 1) % 1679616;
  return (
    prefix +
    Date.now().toString(36) +
    counter.toString(36).padStart(4, "0") +
    Math.random().toString(36).slice(2, 6)
  );
}
