import { Archive, MailCheck, Trash2 } from "lucide-react";

import { cn, useT } from "@/shared/lib";

import { useChatSelection } from "../model/selection";

type Props = {
  className?: string;
  onArchive: (ids: string[]) => void;
  onDelete: (ids: string[]) => void;
  onRead: (ids: string[]) => void;
};

/** Нижняя панель режима «Изм.»: Прочитано / Архив / Удалить (как в видео) */
export function ChatEditBar({ onRead, onArchive, onDelete, className }: Props) {
  const t = useT();
  const selected = useChatSelection((s) => s.selected);
  const exit = useChatSelection((s) => s.exit);
  const disabled = selected.length === 0;

  const item = (
    label: string,
    icon: React.ReactNode,
    onClick: () => void,
    danger?: boolean,
  ) => (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        onClick();
        exit();
      }}
      className={cn(
        "pressable flex flex-1 flex-col items-center gap-1 py-1 text-[0.75rem] font-medium transition-opacity disabled:opacity-35 [&_svg]:size-6",
        danger ? "text-danger" : "text-primary",
      )}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div
      className={cn(
        "glass flex animate-[fade-up_260ms_var(--ease-out-expo)] items-center border-t border-separator px-6 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2",
        className,
      )}
    >
      {item(t.chats.read, <MailCheck />, () => onRead(selected))}
      {item(t.chats.archive, <Archive />, () => onArchive(selected))}
      {item(t.common.delete, <Trash2 />, () => onDelete(selected), true)}
    </div>
  );
}
