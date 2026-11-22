import { useEffect, useState } from "react";

import { ScanLine } from "lucide-react";
import QRCode from "qrcode";

import { UserAvatar, useMe } from "@/entities/user";

import { BRAND } from "@/shared/config";
import { useT } from "@/shared/lib";
import { toast } from "@/shared/model";
import { Button, Logo, Modal } from "@/shared/ui";

/** Личный QR-код сотрудника: по нему коллега открывает чат */
export function QrSheet({
  open,
  onClose,
}: {
  onClose: () => void;
  open: boolean;
}) {
  const t = useT();
  const { data: me } = useMe();
  const [svg, setSvg] = useState("");
  // У демо нет страниц сотрудников, поэтому QR ведёт на само приложение
  const link = me ? `${window.location.origin}${import.meta.env.BASE_URL}` : "";

  useEffect(() => {
    if (!open || !link) return;
    QRCode.toString(link, {
      type: "svg",
      errorCorrectionLevel: "H",
      margin: 0,
      color: { dark: "#1f8a3b", light: "#ffffff00" },
    }).then(setSvg);
  }, [open, link]);

  const share = async () => {
    try {
      if (navigator.share)
        await navigator.share({ title: BRAND.name, text: me?.name, url: link });
      else {
        await navigator.clipboard.writeText(link);
        toast.success(t.common.linkCopied);
      }
    } catch {
      /* пользователь закрыл системное окно */
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t.profile.qr}
      size="md"
      bodyClassName="p-0"
    >
      <div className="relative overflow-hidden bg-[#9cc98f] px-6 pb-8 pt-16 dark:bg-[#24452c]">
        {/* Узор фона, как на обоях чата */}
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, #fff 0 2px, transparent 3px), radial-gradient(circle at 70% 60%, #fff 0 2px, transparent 3px), radial-gradient(circle at 40% 85%, #fff 0 1.5px, transparent 2.5px)",
            backgroundSize: "48px 48px, 64px 64px, 40px 40px",
          }}
        />
        <div className="relative mx-auto flex max-w-[18rem] animate-pop-in flex-col items-center rounded-[1.75rem] bg-white px-6 pb-6 pt-14 shadow-float">
          <span className="absolute -top-11 rounded-full bg-white p-1.5">
            <UserAvatar user={me} size={5.5} />
          </span>
          <div className="relative aspect-square w-full">
            <div
              className="size-full [&_svg]:size-full"
              dangerouslySetInnerHTML={{ __html: svg }}
            />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-1">
              <Logo size={2.6} />
            </span>
          </div>
          <div className="mt-4 text-[1.375rem] font-bold uppercase tracking-wide text-[#1f8a3b]">
            @{me?.handle}
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <Button block onClick={share}>
          {t.profile.shareQr}
        </Button>
        <Button
          variant="tinted"
          block
          icon={<ScanLine className="size-5" />}
          onClick={() => toast.show(t.profile.scanUnavailable)}
        >
          {t.profile.scanQr}
        </Button>
      </div>
    </Modal>
  );
}
