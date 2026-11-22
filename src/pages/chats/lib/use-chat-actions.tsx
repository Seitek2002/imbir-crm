import { useState } from "react";
import { useLocation, useNavigate } from "react-router";

import {
  Archive,
  ArchiveRestore,
  Bell,
  BellOff,
  MailCheck,
  Pin,
  PinOff,
  Trash2,
} from "lucide-react";

import { useBulkChats, useUpdateChatState } from "@/entities/chat";

import type { ChatDTO } from "@/shared/api";
import { useT } from "@/shared/lib";
import { ConfirmDialog, type MenuItem, type SwipeAction } from "@/shared/ui";

/** Действия над чатами: одни и те же для свайпа, контекстного меню и режима «Изм.» */
export function useChatActions() {
  const t = useT();
  const navigate = useNavigate();
  const location = useLocation();
  const update = useUpdateChatState();
  const bulk = useBulkChats();
  const [pendingDelete, setPendingDelete] = useState<null | string[]>(null);

  const togglePin = (c: ChatDTO) =>
    update.mutate({ id: c.id, patch: { pinned: !c.pinned } });
  const toggleMute = (c: ChatDTO) =>
    update.mutate({ id: c.id, patch: { muted: !c.muted } });
  const toggleArchive = (c: ChatDTO) =>
    bulk.mutate({ ids: [c.id], action: c.archived ? "unarchive" : "archive" });
  const markRead = (ids: string[]) => bulk.mutate({ ids, action: "read" });
  const archive = (ids: string[]) => bulk.mutate({ ids, action: "archive" });
  const requestDelete = (ids: string[]) => setPendingDelete(ids);

  const menuItems = (c: ChatDTO): MenuItem[] => [
    ...(c.unreadCount > 0
      ? [
          {
            label: t.chats.read,
            icon: <MailCheck />,
            onSelect: () => markRead([c.id]),
          },
        ]
      : []),
    {
      label: c.pinned ? t.chats.unpin : t.chats.pin,
      icon: c.pinned ? <PinOff /> : <Pin />,
      onSelect: () => togglePin(c),
    },
    {
      label: c.muted ? t.chats.unmute : t.chats.mute,
      icon: c.muted ? <Bell /> : <BellOff />,
      onSelect: () => toggleMute(c),
    },
    {
      label: c.archived ? t.chats.unarchive : t.chats.archive,
      icon: c.archived ? <ArchiveRestore /> : <Archive />,
      onSelect: () => toggleArchive(c),
    },
    {
      label: t.common.delete,
      icon: <Trash2 />,
      danger: true,
      onSelect: () => requestDelete([c.id]),
    },
  ];

  /** Свайп влево: архив / звук / удалить */
  const swipeRight = (c: ChatDTO): SwipeAction[] => [
    {
      label: c.archived ? t.chats.unarchive : t.chats.archive,
      icon: <Archive />,
      color: "#8e8e93",
      onAction: () => toggleArchive(c),
    },
    {
      label: c.muted ? t.chats.unmute : t.chats.mute,
      icon: c.muted ? <Bell /> : <BellOff />,
      color: "#fc8400",
      onAction: () => toggleMute(c),
    },
    {
      label: t.common.delete,
      icon: <Trash2 />,
      color: "#fc302a",
      onAction: () => requestDelete([c.id]),
    },
  ];

  /** Свайп вправо: прочитать / закрепить */
  const swipeLeft = (c: ChatDTO): SwipeAction[] => [
    ...(c.unreadCount > 0
      ? [
          {
            label: t.chats.read,
            icon: <MailCheck />,
            color: "#3c7efc",
            onAction: () => markRead([c.id]),
          },
        ]
      : []),
    {
      label: c.pinned ? t.chats.unpin : t.chats.pin,
      icon: c.pinned ? <PinOff /> : <Pin />,
      color: "#06ae72",
      onAction: () => togglePin(c),
    },
  ];

  const confirmDialog = (
    <ConfirmDialog
      open={Boolean(pendingDelete)}
      onClose={() => setPendingDelete(null)}
      onConfirm={() => {
        const ids = pendingDelete ?? [];
        bulk.mutate({ ids, action: "delete" });
        if (ids.some((id) => location.pathname.startsWith(`/chats/${id}`)))
          navigate("/chats", { replace: true });
        setPendingDelete(null);
      }}
      icon={<Trash2 />}
      title={t.chats.deleteTitle(pendingDelete?.length ?? 1)}
      description={t.chats.deleteText}
      confirmLabel={t.common.delete}
      cancelLabel={t.common.cancel}
      variant="danger"
    />
  );

  return {
    menuItems,
    swipeLeft,
    swipeRight,
    markRead,
    archive,
    requestDelete,
    confirmDialog,
  };
}
