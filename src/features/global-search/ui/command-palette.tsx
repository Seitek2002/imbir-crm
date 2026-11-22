import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { Search, SearchX } from "lucide-react";

import { useChats } from "@/entities/chat";

import { cn, useHotkey, usePresence, useT } from "@/shared/lib";
import { Kbd, MOD_KEY, Spinner } from "@/shared/ui";

import {
  type SearchItem,
  type SearchTab,
  flattenResults,
  useOpenSearchItem,
  useSearch,
} from "../lib/use-search";
import { usePalette } from "../model/palette";
import { SearchResultRow } from "./search-result-row";

/** Командная палитра (десктоп): Ctrl/⌘+K, стрелки, Enter */
export function CommandPalette({ meId }: { meId: string }) {
  const open = usePalette((s) => s.open);
  const setOpen = usePalette((s) => s.setOpen);
  const { mounted, state } = usePresence(open, 200);
  const [session, setSession] = useState(0);

  useHotkey("k", (e) => {
    e.preventDefault();
    const next = !usePalette.getState().open;
    // Новое открытие — новый «сеанс»: пустой запрос, первый пункт
    if (next) setSession((n) => n + 1);
    setOpen(next);
  });

  if (!mounted) return null;
  return (
    <PaletteContent
      key={session}
      meId={meId}
      state={state}
      onClose={() => setOpen(false)}
    />
  );
}

function PaletteContent({
  meId,
  state,
  onClose,
}: {
  meId: string;
  onClose: () => void;
  state: "closed" | "open";
}) {
  const t = useT();
  const setOpen = (v: boolean) => !v && onClose();
  const [query, setQueryRaw] = useState("");
  const [tab, setTabRaw] = useState<SearchTab>("all");
  const [active, setActive] = useState(0);
  const { data, isFetching } = useSearch(query);
  const { data: chats } = useChats();
  const go = useOpenSearchItem(meId);
  const listRef = useRef<HTMLDivElement>(null);

  const setQuery = (q: string) => {
    setQueryRaw(q);
    setActive(0);
  };
  const setTab = (v: SearchTab) => {
    setTabRaw(v);
    setActive(0);
  };

  const items: SearchItem[] = useMemo(() => {
    if (!query.trim())
      return (chats ?? [])
        .slice(0, 7)
        .map((c) => ({ type: "chat" as const, id: c.id, chat: c }));
    return flattenResults(data, tab);
  }, [query, data, tab, chats]);

  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const choose = (item: SearchItem) => {
    setOpen(false);
    go(item, query);
  };

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-start justify-center pt-[12vh]">
      <div
        className="modal-overlay absolute inset-0 bg-black/30 backdrop-blur-[2px]"
        data-state={state}
        onClick={() => setOpen(false)}
      />
      <div
        className="modal-panel relative flex max-h-[70vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-separator bg-elevated shadow-float"
        data-state={state}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => Math.min(items.length - 1, a + 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(0, a - 1));
          } else if (e.key === "Enter" && items[active]) {
            e.preventDefault();
            choose(items[active]);
          } else if (e.key === "Escape") {
            setOpen(false);
          } else if (e.key === "Tab") {
            e.preventDefault();
            const order: SearchTab[] = ["all", "chats", "tasks", "people"];
            setTab(order[(order.indexOf(tab) + (e.shiftKey ? 3 : 1)) % 4]);
          }
        }}
      >
        <div className="flex items-center gap-3 border-b border-separator px-4">
          {isFetching ? (
            <Spinner className="size-5 text-fg-3" />
          ) : (
            <Search className="size-5 text-fg-3" />
          )}
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.search.palettePlaceholder}
            className="h-14 flex-1 bg-transparent text-[1.0625rem] outline-none"
          />
          <Kbd>Esc</Kbd>
        </div>
        <div className="flex gap-1 border-b border-separator px-3 py-2">
          {(["all", "chats", "tasks", "people"] as SearchTab[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              className={cn(
                "h-7 rounded-full px-3 text-[0.8125rem] font-medium transition-colors",
                tab === k
                  ? "bg-primary-soft text-primary"
                  : "text-fg-2 hover:bg-surface-2",
              )}
            >
              {t.search.tabs[k]}
            </button>
          ))}
        </div>
        <div ref={listRef} className="scroll-area min-h-0 flex-1 py-1">
          {!query.trim() && (
            <div className="px-4 pb-1 pt-2 text-[0.75rem] font-medium text-fg-3">
              {t.search.recent}
            </div>
          )}
          {items.length === 0 && query.trim() && !isFetching ? (
            <div className="flex flex-col items-center gap-2 py-10 text-fg-2">
              <SearchX className="size-8 text-fg-3" />
              {t.common.nothingFound}
            </div>
          ) : (
            items.map((item, i) => (
              <div key={item.id} data-index={i}>
                <SearchResultRow
                  item={item}
                  query={query}
                  active={i === active}
                  onHover={() => setActive(i)}
                  onClick={() => choose(item)}
                />
              </div>
            ))
          )}
        </div>
        <div className="flex items-center gap-4 border-t border-separator px-4 py-2 text-[0.75rem] text-fg-3">
          <span className="inline-flex items-center gap-1">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd> {t.search.navigate}
          </span>
          <span className="inline-flex items-center gap-1">
            <Kbd>↵</Kbd> {t.search.openHint}
          </span>
          <span className="ml-auto inline-flex items-center gap-1">
            <Kbd>{MOD_KEY}</Kbd>
            <Kbd>K</Kbd>
          </span>
        </div>
      </div>
    </div>,
    document.body,
  );
}
