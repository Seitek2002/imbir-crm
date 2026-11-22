import { useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";

import { CircleAlert, CircleCheck } from "lucide-react";

import { cn } from "../../lib/cn";
import { useT } from "../../lib/i18n";
import { useToasts } from "../../model/toast";
import { Avatar } from "../avatar/ui";
import { Logo } from "../logo/ui";

/** Тосты снизу (над таб-баром) и баннеры-«пуши» сверху */
export function Toaster() {
  const toasts = useToasts((s) => s.toasts);
  const banners = useToasts((s) => s.banners);
  const dismissBanner = useToasts((s) => s.dismissBanner);
  const navigate = useNavigate();
  const t = useT();

  return createPortal(
    <>
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[150] flex flex-col items-center gap-2 px-2 pt-[max(0.5rem,env(safe-area-inset-top))] lg:items-end lg:px-4 lg:pt-4">
        {banners.map((b) => (
          <BannerCard
            key={b.id}
            closing={b.closing}
            onOpen={() => {
              dismissBanner(b.id);
              if (b.href) navigate(b.href);
            }}
            onDismiss={() => dismissBanner(b.id)}
          >
            {b.avatar ? (
              <Avatar
                spec={b.avatar}
                name={b.avatarName ?? b.title}
                size={2.5}
              />
            ) : (
              <Logo size={2.5} />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-[0.9375rem] font-semibold">
                  {b.title}
                </span>
                <span className="shrink-0 text-xs text-fg-2">
                  {t.common.justNow}
                </span>
              </div>
              <p className="line-clamp-2 text-[0.875rem] leading-snug text-fg-2">
                {b.text}
              </p>
            </div>
          </BannerCard>
        ))}
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(6.5rem+env(safe-area-inset-bottom))] z-[150] flex flex-col items-center gap-2 px-4 lg:bottom-6">
        {toasts.map((t) => (
          <div
            key={t.id}
            data-state={t.closing ? "closed" : "open"}
            className="popover pointer-events-auto flex max-w-sm items-center gap-2 rounded-full bg-[#1c1c22]/92 py-2.5 pl-3.5 pr-4 text-[0.9375rem] font-medium text-white shadow-float backdrop-blur-xl dark:bg-[#2a3847]/95"
          >
            {t.tone === "success" && (
              <CircleCheck className="size-5 text-success" />
            )}
            {t.tone === "error" && (
              <CircleAlert className="size-5 text-danger" />
            )}
            {t.text}
          </div>
        ))}
      </div>
    </>,
    document.body,
  );
}

function BannerCard({
  children,
  closing,
  onOpen,
  onDismiss,
}: {
  children: React.ReactNode;
  closing?: boolean;
  onDismiss: () => void;
  onOpen: () => void;
}) {
  const startY = useRef<null | number>(null);
  return (
    <button
      type="button"
      data-state={closing ? "closed" : "open"}
      onClick={onOpen}
      onPointerDown={(e) => (startY.current = e.clientY)}
      onPointerMove={(e) => {
        // Смахивание вверх закрывает баннер
        if (startY.current != null && startY.current - e.clientY > 24) {
          startY.current = null;
          onDismiss();
        }
      }}
      onPointerUp={() => (startY.current = null)}
      className={cn(
        "banner pointer-events-auto flex w-full max-w-[26rem] items-center gap-3 rounded-[1.375rem] border border-glass-border p-3 text-left shadow-float",
        "bg-elevated/85 backdrop-blur-2xl backdrop-saturate-150",
      )}
    >
      {children}
    </button>
  );
}
