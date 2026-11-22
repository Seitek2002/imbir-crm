import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation, useNavigate } from "react-router";

import { ArrowDown, Info, MessagesSquare, Pin } from "lucide-react";

import {
  TypingDots,
  messagePreview,
  useChat,
  useMarkChatRead,
  useTyping,
} from "@/entities/chat";
import {
  DayDivider,
  MessageBubble,
  type RenderItem,
  type UiMessage,
  buildRenderItems,
  useMessages,
} from "@/entities/message";
import { UserAvatar, firstName, nameColor, useUserMap } from "@/entities/user";

import {
  cn,
  formatDayDivider,
  formatLastSeen,
  useIsDesktop,
  useLongPress,
  useT,
} from "@/shared/lib";
import { toast, useSession } from "@/shared/model";
import {
  Avatar,
  BackButton,
  EmptyState,
  IconButton,
  NavBar,
  Screen,
} from "@/shared/ui";

import { useMessageMenu } from "../lib/use-message-menu";
import { Composer, type ReplyTarget } from "./composer";
import { MediaViewer } from "./media-viewer";

type Props = { chatId: string };

// Стабильная ссылка: селектор zustand не должен возвращать новый массив на каждый рендер
const NO_TYPING: string[] = [];

export function ChatView({ chatId }: Props) {
  const t = useT();
  const navigate = useNavigate();
  const location = useLocation();
  const isDesktop = useIsDesktop();
  const meId = useSession((s) => s.userId) ?? "";
  const { data: chat } = useChat(chatId);
  const { data: messages, isLoading } = useMessages(chatId);
  const users = useUserMap();
  const typingIds = useTyping((s) => s.typing[chatId] ?? NO_TYPING).filter(
    (id) => id !== meId,
  );
  const markRead = useMarkChatRead();
  const [replyTo, setReplyTo] = useState<null | ReplyTarget>(null);
  const [media, setMedia] = useState<null | UiMessage>(null);
  const [highlight, setHighlight] = useState<null | string>(null);
  const [atBottom, setAtBottom] = useState(true);
  const [newBelow, setNewBelow] = useState(0);
  const scroller = useRef<HTMLDivElement>(null);
  const lastCount = useRef(0);
  const list = useMemo(() => messages ?? [], [messages]);

  // Снимок первой загрузки: какие сообщения уже были (анимируем только новые)
  // и где начинается непрочитанное. При смене чата экран пересоздаётся (key).
  const [snapshot, setSnapshot] = useState<{
    firstUnreadAt: null | string;
    ids: Set<string>;
  } | null>(null);
  if (messages && snapshot === null) {
    const unread = chat?.unreadCount ?? 0;
    const incoming = list.filter((m) => m.authorId !== meId);
    const first = unread > 0 ? incoming[incoming.length - unread] : undefined;
    setSnapshot({
      ids: new Set(list.map((m) => m.clientId ?? m.id)),
      firstUnreadAt: first
        ? new Date(new Date(first.createdAt).getTime() - 1).toISOString()
        : null,
    });
  }

  const items: RenderItem[] = useMemo(
    () => buildRenderItems(list, snapshot?.firstUnreadAt ?? null, meId),
    [list, meId, snapshot],
  );

  // Лента по дням: у каждого дня своя секция с «липкой» датой
  const dayGroups = useMemo(() => {
    const groups: {
      date: string;
      items: Exclude<RenderItem, { type: "day" }>[];
      key: string;
    }[] = [];
    for (const it of items) {
      if (it.type === "day")
        groups.push({ key: it.key, date: it.date, items: [] });
      else groups[groups.length - 1]?.items.push(it);
    }
    return groups;
  }, [items]);

  /* ── Скролл ──────────────────────────────────────────────────────────── */

  const scrollToBottom = useCallback((smooth = true) => {
    const el = scroller.current;
    if (el)
      el.scrollTo({
        top: el.scrollHeight,
        behavior: smooth ? "smooth" : "auto",
      });
  }, []);

  // Открыли чат — сразу вниз (или к линии непрочитанного)
  useLayoutEffect(() => {
    if (!messages || lastCount.current !== 0) return;
    lastCount.current = list.length;
    const el = scroller.current;
    if (!el) return;
    const unreadEl = el.querySelector<HTMLElement>("[data-unread]");
    if (unreadEl) el.scrollTop = unreadEl.offsetTop - 80;
    else el.scrollTop = el.scrollHeight;
  }, [messages, list.length]);

  // Новые сообщения: если мы внизу или это наше — прокручиваем, иначе копим счётчик
  useEffect(() => {
    if (
      !messages ||
      lastCount.current === 0 ||
      list.length === lastCount.current
    ) {
      lastCount.current = list.length || lastCount.current;
      return;
    }
    const added = list.length - lastCount.current;
    lastCount.current = list.length;
    if (added <= 0) return;
    const last = list[list.length - 1];
    if (atBottom || last.authorId === meId)
      requestAnimationFrame(() => scrollToBottom());
    else setNewBelow((n) => n + added);
  }, [list, messages, atBottom, meId, scrollToBottom]);

  // Печатает — держим индикатор в поле зрения
  useEffect(() => {
    if (typingIds.length && atBottom)
      requestAnimationFrame(() => scrollToBottom());
  }, [typingIds.length, atBottom, scrollToBottom]);

  // Отметка о прочтении, пока чат открыт и вкладка активна
  useEffect(() => {
    if (!chat?.unreadCount || document.visibilityState !== "visible") return;
    const id = window.setTimeout(() => markRead.mutate(chatId), 400);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat?.unreadCount, chatId]);

  const jumpTo = useCallback((id: string) => {
    const el = scroller.current?.querySelector<HTMLElement>(
      `[data-mid="${id}"]`,
    );
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    setHighlight(id);
    window.setTimeout(() => setHighlight(null), 1400);
  }, []);

  // Переход из поиска к конкретному сообщению
  const hasMessages = Boolean(messages);
  useEffect(() => {
    const target = (location.state as { highlight?: string } | null)?.highlight;
    if (target && hasMessages) requestAnimationFrame(() => jumpTo(target));
  }, [location.state, hasMessages, jumpTo]);

  /* ── Действия с сообщениями ──────────────────────────────────────────── */

  const authorName = (id: null | string) =>
    id === meId ? t.common.you : (users.get(id ?? "")?.name ?? "");

  const reply = (m: UiMessage) =>
    setReplyTo({
      id: m.id,
      name: authorName(m.authorId),
      text: messagePreview(m, t),
    });

  const createTaskFrom = (m: UiMessage) => {
    const text = messagePreview(m, t);
    navigate("/tasks/new", {
      state: {
        prefill: {
          title: text.slice(0, 90),
          descriptionHtml: `<p>${text.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c]!)}</p>`,
          teamChatId: chat?.kind === "group" ? chatId : undefined,
        },
      },
    });
  };

  const menu = useMessageMenu({
    chatId,
    meId,
    readOnly: chat?.readOnly,
    onReply: reply,
    onCreateTask: createTaskFrom,
    renderPreview: (m) => (
      <div
        className={cn(
          "flex max-w-[85vw]",
          m.authorId === meId ? "justify-end" : "justify-start",
        )}
      >
        <MessageBubble message={m} mine={m.authorId === meId} tail />
      </div>
    ),
  });

  /* ── Шапка ───────────────────────────────────────────────────────────── */

  const peer = chat?.peerId ? users.get(chat.peerId) : undefined;
  const subtitle = (() => {
    if (!chat) return "";
    if (typingIds.length) {
      return (
        <span className="inline-flex items-center gap-1 text-primary">
          {chat.kind === "direct"
            ? t.chats.typing
            : t.chats.typingName(
                firstName(users.get(typingIds[0])?.name ?? ""),
              )}
          <TypingDots />
        </span>
      );
    }
    if (chat.kind === "direct") {
      if (!peer) return "";
      return peer.presence === "online" ? (
        <span className="text-primary">{t.chats.online}</span>
      ) : (
        formatLastSeen(peer.lastSeenAt)
      );
    }
    return t.chats.members(chat.membersCount);
  })();

  const openInfo = () => navigate(`/chats/${chatId}/info`);

  if (!chat && !isLoading) {
    return (
      <Screen tone="chat">
        <NavBar
          variant="glass"
          left={!isDesktop && <BackButton fallback="/chats" />}
        />
        <EmptyState icon={<MessagesSquare />} title={t.common.nothingFound} />
      </Screen>
    );
  }

  return (
    <Screen tone="chat" className="chat-wallpaper">
      {/* Мягкая подложка под плавающей шапкой: лента «уходит» под неё, как в iOS */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[calc(env(safe-area-inset-top)+4.75rem)] bg-gradient-to-b from-chat via-chat/80 to-transparent" />
      <NavBar
        variant="transparent"
        className="absolute inset-x-0 top-0"
        left={!isDesktop && <BackButton fallback="/chats" />}
        title={chat?.title ?? ""}
        subtitle={subtitle}
        pill
        onTitleClick={openInfo}
        right={
          <div className="flex items-center gap-1.5">
            {isDesktop && (
              <IconButton
                label={t.chatInfo.title}
                variant="glass"
                onClick={openInfo}
              >
                <Info />
              </IconButton>
            )}
            <button
              type="button"
              onClick={openInfo}
              className="pressable rounded-full shadow-soft"
            >
              {chat && (
                <Avatar
                  spec={chat.avatar}
                  name={chat.title}
                  size={2.5}
                  online={
                    chat.kind === "direct"
                      ? peer?.presence === "online"
                      : undefined
                  }
                />
              )}
            </button>
          </div>
        }
      />

      {chat?.pinnedMessage && (
        <button
          type="button"
          onClick={() => jumpTo(chat.pinnedMessage!.id)}
          className="glass absolute inset-x-3 top-[calc(env(safe-area-inset-top)+3.75rem)] z-10 flex animate-fade-in items-center gap-2.5 rounded-2xl border border-glass-border px-3 py-2 text-left shadow-soft lg:top-[4.25rem]"
        >
          <Pin className="size-4 shrink-0 rotate-45 text-primary" />
          <span className="min-w-0 flex-1">
            <span className="block text-[0.75rem] font-semibold text-primary">
              {t.chats.pinned}
            </span>
            <span className="block truncate text-[0.8125rem] text-fg-2">
              {messagePreview(chat.pinnedMessage, t)}
            </span>
          </span>
        </button>
      )}

      <div
        ref={scroller}
        onScroll={(e) => {
          const el = e.currentTarget;
          const bottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
          setAtBottom(bottom);
          if (bottom) setNewBelow(0);
        }}
        className={cn(
          "scroll-area min-h-0 flex-1 px-2.5 pb-2 lg:px-6",
          chat?.pinnedMessage
            ? "pt-[calc(env(safe-area-inset-top)+7.5rem)]"
            : "pt-[calc(env(safe-area-inset-top)+4.25rem)]",
        )}
      >
        <div className="mx-auto flex min-h-full max-w-3xl flex-col justify-end">
          {isLoading ? (
            <MessagesSkeleton />
          ) : list.length === 0 ? (
            <div className="m-auto max-w-xs animate-pop-in rounded-3xl bg-surface/80 p-6 text-center backdrop-blur">
              <div className="text-4xl">👋</div>
              <div className="mt-2 font-semibold">{t.chats.noMessages}</div>
              <div className="mt-1 text-[0.875rem] text-fg-2">
                {t.chats.noMessagesHint}
              </div>
            </div>
          ) : (
            dayGroups.map((g) => (
              // Секция на каждый день: «липкая» дата выталкивается следующей
              <section key={g.key}>
                <DayDivider label={formatDayDivider(g.date)} />
                {g.items.map((it) => {
                  if (it.type === "unread") {
                    return (
                      <div
                        key={it.key}
                        data-unread
                        className="my-2 flex items-center justify-center"
                      >
                        <span className="rounded-full bg-black/[0.12] px-3 py-0.5 text-[0.8125rem] font-medium text-white backdrop-blur dark:bg-white/10">
                          {t.chats.newMessages}
                        </span>
                      </div>
                    );
                  }
                  const m = it.message;
                  const mine = m.authorId === meId;
                  const author = users.get(m.authorId ?? "");
                  const isGroup = chat?.kind !== "direct";
                  return (
                    <MessageRow
                      key={it.key}
                      message={m}
                      mine={mine}
                      first={it.first}
                      last={it.last}
                      showAvatar={isGroup && !mine}
                      author={author}
                      replyAuthorName={
                        m.replyTo ? authorName(m.replyTo.authorId) : undefined
                      }
                      highlighted={highlight === m.id || menu.activeId === m.id}
                      animate={
                        Boolean(snapshot) &&
                        !snapshot?.ids.has(m.clientId ?? m.id)
                      }
                      onMenu={(x, y) => menu.open(m, { x, y })}
                      onDoubleClick={() =>
                        !chat?.readOnly && isDesktop && reply(m)
                      }
                      onReplyClick={jumpTo}
                      onOpenTask={(id) => navigate(`/tasks/${id}`)}
                      onOpenMedia={setMedia}
                      onFileClick={(msg) => {
                        if (msg.attachment?.url) {
                          const a = document.createElement("a");
                          a.href = msg.attachment.url;
                          a.download = msg.attachment.name;
                          a.click();
                        } else toast.show(t.common.demoOnly);
                      }}
                    />
                  );
                })}
              </section>
            ))
          )}

          {typingIds.length > 0 && (
            <div className="mt-1 flex animate-message-in items-end gap-2">
              {chat?.kind !== "direct" && (
                <UserAvatar user={users.get(typingIds[0])} size={2} />
              )}
              <div className="flex h-9 items-center rounded-[1.15rem] rounded-bl-[0.4rem] bg-bubble-in px-3.5 text-fg-3 shadow-[0_1px_1px_rgb(0_0_0/0.06)]">
                <TypingDots />
              </div>
            </div>
          )}
        </div>
      </div>

      {!atBottom && (
        <button
          type="button"
          onClick={() => scrollToBottom()}
          className="glass absolute bottom-[calc(env(safe-area-inset-bottom)+5rem)] right-3 z-10 flex size-11 animate-pop-in items-center justify-center rounded-full border border-glass-border text-fg-2 shadow-float lg:bottom-24 lg:right-6"
          aria-label="down"
        >
          <ArrowDown className="size-5" />
          {newBelow > 0 && (
            <span className="absolute -top-1.5 left-1/2 flex h-5 min-w-5 -translate-x-1/2 animate-pop-in items-center justify-center rounded-full bg-primary px-1.5 text-[0.6875rem] font-semibold text-white">
              {newBelow}
            </span>
          )}
        </button>
      )}

      {chat?.readOnly ? (
        <div className="glass shrink-0 border-t border-separator px-6 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 text-center text-[0.8125rem] text-fg-2">
          {t.chats.readOnly(chat.title)}
        </div>
      ) : (
        <Composer
          chatId={chatId}
          meId={meId}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
          onSent={() => requestAnimationFrame(() => scrollToBottom())}
          onCreateTask={() =>
            navigate("/tasks/new", {
              state: {
                prefill: {
                  teamChatId: chat?.kind === "group" ? chatId : undefined,
                },
              },
            })
          }
        />
      )}

      {menu.element}
      <MediaViewer
        message={media}
        authorName={media ? authorName(media.authorId) : ""}
        onClose={() => setMedia(null)}
      />
    </Screen>
  );
}

/* ── Строка сообщения ──────────────────────────────────────────────────── */

type RowProps = {
  animate: boolean;
  author: ReturnType<ReturnType<typeof useUserMap>["get"]>;
  first: boolean;
  highlighted: boolean;
  last: boolean;
  message: UiMessage;
  mine: boolean;
  onDoubleClick: () => void;
  onFileClick: (m: UiMessage) => void;
  onMenu: (x: number, y: number) => void;
  onOpenMedia: (m: UiMessage) => void;
  onOpenTask: (id: string) => void;
  onReplyClick: (id: string) => void;
  replyAuthorName?: string;
  showAvatar: boolean;
};

function MessageRow({
  message: m,
  mine,
  first,
  last,
  showAvatar,
  author,
  replyAuthorName,
  highlighted,
  animate,
  onMenu,
  onDoubleClick,
  ...handlers
}: RowProps) {
  const longPress = useLongPress({
    onLongPress: (e) => onMenu(e.clientX, e.clientY),
  });
  return (
    <div
      data-mid={m.id}
      className={cn(
        "flex items-end gap-2",
        mine ? "justify-end pl-12" : "justify-start pr-12",
        first ? "mt-2" : "mt-0.5",
      )}
      onDoubleClick={onDoubleClick}
      {...longPress}
    >
      {showAvatar && (
        <span className="w-8 shrink-0">
          {last && (
            <UserAvatar user={author} size={2} className="animate-fade-in" />
          )}
        </span>
      )}
      <MessageBubble
        message={m}
        mine={mine}
        authorName={author?.name}
        authorColor={author ? nameColor(author.id) : undefined}
        showAuthor={showAvatar && first}
        tail={last}
        replyAuthorName={replyAuthorName}
        highlighted={highlighted}
        animate={animate}
        {...handlers}
      />
    </div>
  );
}

function MessagesSkeleton() {
  return (
    <div className="flex animate-fade-in flex-col gap-2 py-4">
      {[52, 70, 38, 64, 46, 58].map((w, i) => (
        <div
          key={i}
          className={cn("flex", i % 3 === 2 ? "justify-end" : "justify-start")}
        >
          <div
            className="skeleton h-10 rounded-2xl"
            style={{ width: `${w}%` }}
          />
        </div>
      ))}
    </div>
  );
}
