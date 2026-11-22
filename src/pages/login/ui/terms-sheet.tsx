import { useT } from "@/shared/lib";
import { Button, Modal, TermsContent } from "@/shared/ui";

type Props = {
  onAccept?: () => void;
  onClose: () => void;
  open: boolean;
};

/** Шторка с условиями: «Принять» отмечает переключатель на форме входа */
export function TermsSheet({ open, onClose, onAccept }: Props) {
  const t = useT();
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="full"
      hideHeader
      bodyClassName="flex flex-col p-0"
    >
      <div className="px-5 pt-2 lg:pt-5">
        <h2 className="text-[1.375rem] font-bold">{t.terms.title}</h2>
      </div>
      <div className="scroll-area min-h-0 flex-1 px-5">
        <TermsContent />
      </div>
      <div className="shrink-0 border-t border-separator bg-elevated px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
        <p className="mb-3 text-center text-[0.75rem] leading-snug text-fg-2">
          {t.terms.note}
        </p>
        {onAccept && (
          <Button
            block
            onClick={() => {
              onAccept();
              onClose();
            }}
          >
            {t.terms.accept}
          </Button>
        )}
        <Button
          variant="ghost"
          block
          size="md"
          className="mt-1"
          onClick={onClose}
        >
          {t.common.close}
        </Button>
      </div>
    </Modal>
  );
}
