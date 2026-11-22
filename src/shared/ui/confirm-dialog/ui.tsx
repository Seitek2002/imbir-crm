import type { ReactNode } from "react";

import { cn } from "../../lib/cn";
import { Button } from "../button/ui";
import { Modal } from "../modal/ui";

type Props = {
  cancelLabel: string;
  confirmLabel: string;
  description?: string;
  icon?: ReactNode;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
  open: boolean;
  title: string;
  /** danger — для необратимых действий (красный акцент) */
  variant?: "danger" | "default";
};

/** Подтверждение действия (порт ConfirmDialog из imbir-nextjs) */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  icon,
  confirmLabel,
  cancelLabel,
  variant = "default",
  loading,
}: Props) {
  const danger = variant === "danger";
  return (
    <Modal open={open} onClose={onClose} hideHeader size="sm" locked={loading}>
      <div className="flex flex-col items-center gap-4 pt-4 text-center lg:pt-6">
        {icon && (
          <div
            className={cn(
              "flex size-14 animate-pop-in items-center justify-center rounded-full [&_svg]:size-7",
              danger
                ? "bg-danger/10 text-danger"
                : "bg-primary-soft text-primary",
            )}
          >
            {icon}
          </div>
        )}
        <div>
          <h2 className="text-lg font-bold">{title}</h2>
          {description && (
            <p className="mt-1.5 text-[0.9375rem] leading-snug text-fg-2">
              {description}
            </p>
          )}
        </div>
        <div className="mt-2 flex w-full gap-3">
          <Button
            variant="outline"
            size="md"
            block
            onClick={onClose}
            disabled={loading}
            className="rounded-full"
          >
            {cancelLabel}
          </Button>
          <Button
            variant={danger ? "danger" : "primary"}
            size="md"
            block
            loading={loading}
            onClick={onConfirm}
            className="rounded-full"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
