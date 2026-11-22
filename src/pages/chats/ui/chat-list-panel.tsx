import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";

import { useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  ChevronLeft,
  CirclePlus,
  MessagesSquare,
  SquarePen,
} from "lucide-react";

import { ChatRow, useChats, useDrafts, useTyping } from "@/entities/chat";
import { prefetchMessages } from "@/entities/message";
import { firstName, useUserMap } from "@/entities/user";

import type { ChatDTO } from "@/shared/api";
import {
  cn,
  haptic,
  useIsDesktop,
  useLongPress,
  useScrollRestore,
  useT,
} from "@/shared/lib";
import { useSession } from "@/shared/model";
import {
  ContextMenu,
  EmptyState,
  IconButton,
  type MenuAnchor,
  NavPillButton,
  SearchField,
  SkeletonList,
  SwipeRow,
} from "@/shared/ui";

import { useChatActions } from "../lib/use-chat-actions";
import { useChatSelection } from "../model/selection";
import { ChatEditBar } from "./edit-bar";
import { StoriesMini, StoriesRow } from "./stories-row";

/** Список чатов: шапка «Изм. / Чаты / + / ✎», статусы, поиск, свайпы и меню */
export function ChatListPanel() {
  const t = useT();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isDesktop = useIsDesktop();
  const { chatId: activeId } = useParams();
  const meId = useSession((s) => s.userId) ?? "";
  const { data: chats, isLoading } = useChats();
  const users = useUserMap();
  const typing = useTyping((s) => s.typing);
  const drafts = useDrafts((s) => s.drafts);
  const { editMode, selected, enter, exit, toggle } = useChatSelection();
  const actions = useChatActions();
  const [query, setQuery] = useState("");
  const [showArchive, setShowArchive] = useState(false);
  const [menu, setMenu] = useState<{
    anchor: MenuAnchor;
    chat: ChatDTO;
  } | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const scrollRef = useScrollRestore<HTMLDivElement>("chat-list");

  const archivedCount = (chats ?? []).filter((c) => c.archived).length;
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (chats ?? [])
      .filter((c) => (showArchive ? c.archived : !c.archived))
      .filter((c) => !q || c.title.toLowerCase().includes(q));
  }, [chats, query, showArchive]);

  const typingLabel = (c: ChatDTO) => {
    const ids = (typing[c.id] ?? []).filter((id) => id !== meId);
    if (!ids.length) return null;
    if (c.kind === "direct") return t.chats.typing;
    return t.chats.typingName(firstName(users.get(ids[0])?.name ?? ""));
  };

  const open = (c: ChatDTO) => {
    if (editMode) {
      haptic("light");
      return toggle(c.id);
    }
    navigate(`/chats/${c.id}`, { replace: isDesktop && Boolean(activeId) });
  };

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-surface">
      <header className="relative z-20 shrink-0 bg-surface pt-safe">
        <div className="relative flex h-[3.375rem] items-center justify-between px-3 lg:h-14">
          {showArchive ? (
            <button
              type="button"
              onClick={() => setShowArchive(false)}
              className="flex items-center text-[1rem] text-primary"
            >
              <ChevronLeft className="size-6" /> {t.chats.title}
            </button>
          ) : (
            <NavPillButton onClick={editMode ? exit : enter} active={editMode}>
              {editMode ? t.common.done : t.common.edit}
            </NavPillButton>
          )}
          <div className="absolute left-1/2 flex -translate-x-1/2 items-center">
            {collapsed && !showArchive && <StoriesMini />}
            <h1 className="text-[1.0625rem] font-semibold">
              {showArchive ? t.chats.archive : t.chats.title}
            </h1>
          </div>
          <div className="flex items-center gap-0.5">
            <IconButton
              label={t.newChat.group}
              onClick={() => navigate("/chats/new?mode=group")}
              variant="plain"
            >
              <CirclePlus className="text-fg" />
            </IconButton>
            <IconButton
              label={t.newChat.direct}
              onClick={() => navigate("/chats/new?mode=direct")}
              variant="plain"
            >
              <SquarePen className="text-fg" />
            </IconButton>
          </div>
        </div>
      </header>

      <div
        ref={scrollRef}
        data-tab-scroll
        onScroll={(e) => setCollapsed((e.target as HTMLElement).scrollTop > 70)}
        className="scroll-area min-h-0 flex-1 pb-28 lg:pb-4"
      >
        {!showArchive && <StoriesRow />}
        <div className="px-4 pb-2">
          <SearchField
            value={query}
            onChange={setQuery}
            placeholder={t.common.search}
          />
        </div>

        {!showArchive && archivedCount > 0 && !query && (
          <button
            type="button"
            onClick={() => setShowArchive(true)}
            className="flex w-full animate-fade-in items-center gap-3 px-4 py-2 text-left active:bg-surface-2 pointer-fine:hover:bg-surface-2"
          >
            <span className="flex size-[3.25rem] items-center justify-center rounded-full bg-fg-3/30 text-fg-2">
              <Archive className="size-6" />
            </span>
            <span className="flex-1">
              <span className="block text-[1.0625rem] font-semibold">
                {t.chats.archive}
              </span>
              <span className="block text-[0.875rem] text-fg-2">
                {t.chats.archived(archivedCount)}
              </span>
            </span>
          </button>
        )}

        {isLoading ? (
          <SkeletonList rows={8} />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={<MessagesSquare />}
            title={query ? t.common.nothingFound : t.chats.empty}
            text={query ? undefined : t.chats.emptyHint}
          />
        ) : (
          <div>
            {visible.map((c, i) => (
              <ChatListItem
                key={c.id}
                chat={c}
                index={i}
                meId={meId}
                online={
                  c.peerId
                    ? users.get(c.peerId)?.presence === "online"
                    : undefined
                }
                typingLabel={typingLabel(c)}
                draft={c.id !== activeId ? drafts[c.id] : undefined}
                active={isDesktop && c.id === activeId}
                editMode={editMode}
                checked={selected.includes(c.id)}
                swipeLeft={actions.swipeLeft(c)}
                swipeRight={actions.swipeRight(c)}
                onOpen={() => open(c)}
                onMenu={(anchor) => !editMode && setMenu({ chat: c, anchor })}
                onPrefetch={() => void prefetchMessages(qc, c.id)}
              />
            ))}
          </div>
        )}
      </div>

      {editMode && (
        <div className="absolute inset-x-0 bottom-0 z-50">
          <ChatEditBar
            onRead={actions.markRead}
            onArchive={actions.archive}
            onDelete={actions.requestDelete}
          />
        </div>
      )}

      <ContextMenu
        anchor={menu?.anchor ?? null}
        onClose={() => setMenu(null)}
        items={menu ? actions.menuItems(menu.chat) : []}
      />
      {actions.confirmDialog}
    </div>
  );
}

type ItemProps = {
  active: boolean;
  chat: ChatDTO;
  checked: boolean;
  draft?: string;
  editMode: boolean;
  index: number;
  meId: string;
  online?: boolean;
  onMenu: (anchor: MenuAnchor) => void;
  onOpen: () => void;
  onPrefetch: () => void;
  swipeLeft: ReturnType<ReturnType<typeof useChatActions>["swipeLeft"]>;
  swipeRight: ReturnType<ReturnType<typeof useChatActions>["swipeRight"]>;
  typingLabel: null | string;
};

function ChatListItem({
  chat,
  index,
  swipeLeft,
  swipeRight,
  onOpen,
  onMenu,
  onPrefetch,
  editMode,
  ...rest
}: ItemProps) {
  const longPress = useLongPress({
    onLongPress: (e) => onMenu({ x: e.clientX, y: e.clientY }),
  });
  return (
    <SwipeRow
      left={swipeLeft}
      right={swipeRight}
      disabled={editMode}
      className={cn(
        "animate-fade-in",
        chat.pinned ? "bg-surface-2/70" : "bg-surface",
      )}
    >
      <ChatRow
        chat={chat}
        editMode={editMode}
        style={{ animationDelay: `${Math.min(index, 10) * 18}ms` }}
        onClick={onOpen}
        onKeyDown={(e) => e.key === "Enter" && onOpen()}
        onMouseEnter={onPrefetch}
        onPointerDownCapture={onPrefetch}
        {...longPress}
        {...rest}
      />
    </SwipeRow>
  );
}
