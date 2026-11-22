import type { ReactNode } from "react";

import { Check } from "lucide-react";

import { cn } from "../../lib/cn";
import { haptic } from "../../lib/haptics";
import { useIsDesktop } from "../../lib/hooks";
import { Modal } from "../modal/ui";

export type ActionSheetOption = {
  danger?: boolean;
  hint?: string;
  icon?: ReactNode;
  label: string;
  onSelect: () => void;
  selected?: boolean;
};

type Props = {
  cancelLabel: string;
  onClose: () => void;
  open: boolean;
  options: ActionSheetOption[];
  title?: string;
};

/** Список действий: на телефоне — iOS action sheet, на десктопе — компактное меню */
export function ActionSheet({
  open,
  onClose,
  title,
  options,
  cancelLabel,
}: Props) {
  const isDesktop = useIsDesktop();

  const select = (o: ActionSheetOption) => {
    haptic("light");
    onClose();
    // Действие — после старта анимации закрытия, чтобы не было «рывка»
    window.setTimeout(o.onSelect, 60);
  };

  const list = (
    <div className="overflow-hidden rounded-[0.875rem] bg-elevated lg:rounded-none lg:bg-transparent">
      {title && (
        <div className="border-b border-separator px-4 py-3 text-center text-[0.8125rem] font-medium text-fg-2 lg:text-left">
          {title}
        </div>
      )}
      {options.map((o, i) => (
        <button
          key={i}
          type="button"
          onClick={() => select(o)}
          className={cn(
            "relative flex w-full items-center gap-3 px-4 text-[1.0625rem] transition-colors active:bg-surface-2 pointer-fine:hover:bg-surface-2 lg:h-11 lg:rounded-lg lg:text-[0.9375rem]",
            "h-14 justify-center lg:justify-start",
            i > 0 && "border-t border-separator lg:border-0",
            o.danger ? "text-danger" : "text-primary lg:text-fg",
          )}
        >
          {o.icon && (
            <span className="text-current [&_svg]:size-5 lg:text-fg-2">
              {o.icon}
            </span>
          )}
          <span className={cn(o.selected && "font-semibold")}>{o.label}</span>
          {o.hint && (
            <span className="absolute right-12 text-sm text-fg-2 lg:static lg:ml-auto">
              {o.hint}
            </span>
          )}
          {o.selected && (
            <Check
              className="absolute right-4 size-5 text-primary lg:static lg:ml-auto"
              strokeWidth={2.6}
            />
          )}
        </button>
      ))}
    </div>
  );

  if (isDesktop) {
    return (
      <Modal
        open={open}
        onClose={onClose}
        hideHeader
        size="sm"
        bodyClassName="p-2"
      >
        {list}
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={onClose} hideHeader bare>
      <div className="flex flex-col gap-2">
        {list}
        <button
          type="button"
          onClick={onClose}
          className="h-14 rounded-[0.875rem] bg-elevated text-[1.0625rem] font-semibold text-primary active:bg-surface-2"
        >
          {cancelLabel}
        </button>
      </div>
    </Modal>
  );
}
