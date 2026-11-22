const ALLOWED = new Set([
  "B",
  "STRONG",
  "I",
  "EM",
  "U",
  "S",
  "UL",
  "OL",
  "LI",
  "P",
  "DIV",
  "BR",
  "A",
  "H3",
  "H4",
  "SPAN",
  "BLOCKQUOTE",
]);

/**
 * Оставляет только безопасную разметку из редактора задач:
 * базовое форматирование, списки и ссылки (http/https/mailto).
 */
export function sanitizeHtml(html: string): string {
  if (typeof DOMParser === "undefined") return html;
  const doc = new DOMParser().parseFromString(
    `<div>${html}</div>`,
    "text/html",
  );
  const root = doc.body.firstElementChild;
  if (!root) return "";

  const walk = (node: Element) => {
    for (const child of Array.from(node.children)) {
      if (!ALLOWED.has(child.tagName)) {
        // Неизвестный тег заменяем его содержимым
        const fragment = doc.createDocumentFragment();
        while (child.firstChild) fragment.appendChild(child.firstChild);
        child.replaceWith(fragment);
        continue;
      }
      for (const attr of Array.from(child.attributes)) {
        const keep =
          child.tagName === "A" &&
          attr.name === "href" &&
          /^(https?:|mailto:)/i.test(attr.value);
        if (!keep) child.removeAttribute(attr.name);
      }
      if (child.tagName === "A") {
        child.setAttribute("target", "_blank");
        child.setAttribute("rel", "noopener noreferrer");
      }
      walk(child);
    }
  };
  walk(root);
  return root.innerHTML;
}

export function htmlToText(html: string): string {
  if (typeof DOMParser === "undefined") return html.replace(/<[^>]+>/g, " ");
  const doc = new DOMParser().parseFromString(html, "text/html");
  return (doc.body.textContent ?? "").replace(/\s+/g, " ").trim();
}
