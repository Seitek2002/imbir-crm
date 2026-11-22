import { type ReactNode, useState } from "react";

import { Copy, ListTodo, Pin, PinOff, Reply, Trash2 } from "lucide-react";

import {
  type UiMessage,
  useDeleteMessage,
  usePinMessage,
} from "@/entities/message";

import { useT } from "@/shared/lib";
import { toast } from "@/shared/model";
import {
  ConfirmDialog,
  ContextMenu,
  type MenuAnchor,
  type MenuItem,
} from "@/shared/ui";

type Options = {
  chatId: string;
  meId: string;
  onCreateTask: (m: UiMessage) => void;
  onReply: (m: UiMessage) => void;
  readOnly?: boolean;
  /** Превью сообщения над меню (на телефоне) */
  renderPreview?: (m: UiMessage) => ReactNode;
};

/** Контекстное меню сообщения: долгий тап / правый клик */
export function useMessageMenu({
  chatId,
  meId,
  readOnly,
  onReply,
  onCreateTask,
  renderPreview,
}: Options) {
  const t = useT();
  const [target, setTarget] = useState<{
    anchor: MenuAnchor;
    message: UiMessage;
  } | null>(null);
  const [toDelete, setToDelete] = useState<null | UiMessage>(null);
  const del = useDeleteMessage(chatId);
  const pin = usePinMessage(chatId);

  const open = (message: UiMessage, anchor: MenuAnchor) => {
    if (message.pending) return;
    setTarget({ message, anchor });
  };

  const items = (m: UiMessage): MenuItem[] => {
    const copyText = m.text || m.taskEvent?.text || "";
    return [
      ...(!readOnly
        ? [
            {
              label: t.chats.reply,
              icon: <Reply />,
              onSelect: () => onReply(m),
            },
          ]
        : []),
      ...(copyText
        ? [
            {
              label: t.common.copy,
              icon: <Copy />,
              onSelect: () => {
                void navigator.clipboard?.writeText(copyText);
                toast.show(t.common.copied);
              },
            },
          ]
        : []),
      ...(!readOnly
        ? [
            {
              label: m.pinned ? t.chats.unpinMessage : t.chats.pinMessage,
              icon: m.pinned ? <PinOff /> : <Pin />,
              onSelect: () => pin.mutate({ id: m.id, pinned: !m.pinned }),
            },
          ]
        : []),
      ...(m.kind !== "task_event"
        ? [
            {
              label: t.chats.createTask,
              icon: <ListTodo />,
              onSelect: () => onCreateTask(m),
            },
          ]
        : []),
      ...(m.authorId === meId && !readOnly
        ? [
            {
              label: t.chats.deleteMessage,
              icon: <Trash2 />,
              danger: true,
              onSelect: () => setToDelete(m),
            },
          ]
        : []),
    ];
  };

  const element = (
    <>
      <ContextMenu
        anchor={target?.anchor ?? null}
        onClose={() => setTarget(null)}
        items={target ? items(target.message) : []}
        preview={
          target && renderPreview ? renderPreview(target.message) : undefined
        }
      />
      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) del.mutate(toDelete.id);
          setToDelete(null);
        }}
        icon={<Trash2 />}
        title={t.chats.deleteMessageTitle}
        confirmLabel={t.common.delete}
        cancelLabel={t.common.cancel}
        variant="danger"
      />
    </>
  );

  return { open, element, activeId: target?.message.id ?? null };
}
