import { useMemo, useRef, useState } from "react";

import { Clock, Search, SearchX, X } from "lucide-react";

import { useChats } from "@/entities/chat";

import { cn, useT } from "@/shared/lib";
import { useSettings } from "@/shared/model";
import { EmptyState, SectionLabel, Spinner } from "@/shared/ui";

import {
  type SearchItem,
  type SearchTab,
  flattenResults,
  useOpenSearchItem,
  useSearch,
} from "../lib/use-search";
import { SearchResultRow } from "./search-result-row";

const SECTION: Record<
  SearchItem["type"],
  "chats" | "messages" | "people" | "tasks"
> = {
  chat: "chats",
  task: "tasks",
  person: "people",
  message: "messages",
};

/** Экран поиска (телефон): результаты сверху, поле и вкладки — у клавиатуры */
export function SearchView({
  meId,
  onClose,
}: {
  meId: string;
  onClose: () => void;
}) {
  const t = useT();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<SearchTab>("all");
  const { data, isFetching } = useSearch(query);
  const { data: chats } = useChats();
  const recent = useSettings((s) => s.recentSearches);
  const clearRecent = useSettings((s) => s.clearRecentSearches);
  const open = useOpenSearchItem(meId);
  const input = useRef<HTMLInputElement>(null);
  const items = useMemo(() => flattenResults(data, tab), [data, tab]);
  const hasQuery = query.trim().length > 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-surface">
      <div className="scroll-area min-h-0 flex-1 pt-safe">
        {!hasQuery ? (
          <div className="animate-fade-in">
            {recent.length > 0 && (
              <>
                <div className="flex items-center justify-between pr-4">
                  <SectionLabel>{t.search.recent}</SectionLabel>
                  <button
                    type="button"
                    onClick={clearRecent}
                    className="pt-4 text-[0.875rem] text-primary"
                  >
                    {t.search.clear}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 px-4 pb-2">
                  {recent.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setQuery(q)}
                      className="pressable inline-flex h-8 items-center gap-1.5 rounded-full bg-surface-2 px-3 text-[0.875rem]"
                    >
                      <Clock className="size-3.5 text-fg-3" />
                      {q}
                    </button>
                  ))}
                </div>
              </>
            )}
            <SectionLabel>
              {recent.length ? t.search.chats : t.search.recent}
            </SectionLabel>
            {(chats ?? []).slice(0, 6).map((c) => (
              <SearchResultRow
                key={c.id}
                item={{ type: "chat", id: c.id, chat: c }}
                query=""
                onClick={() => open({ type: "chat", id: c.id, chat: c }, "")}
              />
            ))}
          </div>
        ) : items.length === 0 && !isFetching ? (
          <EmptyState
            icon={<SearchX />}
            title={t.common.nothingFound}
            text={t.search.hint}
          />
        ) : (
          <div className={cn("transition-opacity", isFetching && "opacity-60")}>
            {items.map((item, i) => {
              const showLabel =
                tab === "all" && (i === 0 || items[i - 1].type !== item.type);
              return (
                <div key={item.id} className="animate-fade-in">
                  {showLabel && (
                    <SectionLabel>{t.search[SECTION[item.type]]}</SectionLabel>
                  )}
                  <SearchResultRow
                    item={item}
                    query={query}
                    onClick={() => open(item, query)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="glass border-t border-separator pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <div className="flex gap-1 overflow-x-auto px-3 py-2 scrollbar-none">
          {(["chats", "tasks", "people", "all"] as SearchTab[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              className={cn(
                "pressable h-8 shrink-0 rounded-full px-3.5 text-[0.9375rem] font-medium transition-colors",
                tab === k
                  ? "bg-surface-3 text-fg dark:bg-surface-2"
                  : "text-fg-2",
              )}
            >
              {t.search.tabs[k]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 px-3">
          <label className="flex h-11 flex-1 items-center gap-2 rounded-full bg-surface-2 px-3.5">
            {isFetching ? (
              <Spinner className="size-4 text-fg-3" />
            ) : (
              <Search className="size-[1.1rem] text-fg-3" />
            )}
            <input
              ref={input}
              autoFocus
              type="search"
              enterKeyHint="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.search.placeholder}
              className="h-full flex-1 bg-transparent text-[1.0625rem] outline-none"
            />
          </label>
          <button
            type="button"
            onClick={onClose}
            className="pressable flex size-11 items-center justify-center rounded-full bg-surface-2 text-fg-2"
            aria-label={t.common.close}
          >
            <X className="size-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
