import { useState } from "react";
import { useNavigate } from "react-router";

import { useQueryClient } from "@tanstack/react-query";
import { RotateCcw } from "lucide-react";

import { api } from "@/shared/api";
import { BRAND } from "@/shared/config";
import { useIsDesktop, useT } from "@/shared/lib";
import { toast } from "@/shared/model";
import {
  BackButton,
  ConfirmDialog,
  ListGroup,
  ListRow,
  Logo,
  NavBar,
  Screen,
  ScrollArea,
  Wordmark,
} from "@/shared/ui";

function detectPlatform() {
  const ua = navigator.userAgent;
  const standalone = window.matchMedia("(display-mode: standalone)").matches;
  const os = /iPhone|iPad/.test(ua)
    ? "iOS"
    : /Android/.test(ua)
      ? "Android"
      : /Mac/.test(ua)
        ? "macOS"
        : /Win/.test(ua)
          ? "Windows"
          : "Web";
  return standalone ? `${os} · PWA` : `${os} · Web`;
}

export function ProfileAboutPage() {
  const t = useT();
  const isDesktop = useIsDesktop();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  const reset = async () => {
    setBusy(true);
    await api.post("/demo/reset");
    await qc.invalidateQueries();
    setBusy(false);
    setConfirm(false);
    toast.success(t.common.done);
    navigate("/chats", { replace: true });
  };

  return (
    <Screen>
      <NavBar
        title={t.profile.about}
        left={!isDesktop && <BackButton fallback="/profile" />}
      />
      <ScrollArea className="pb-10">
        <div className="mx-auto max-w-lg">
          <div className="flex animate-fade-up flex-col items-center gap-3 px-8 pb-6 pt-4 text-center">
            <Logo
              size={5}
              className="shadow-[0_14px_30px_-12px_rgb(252_36_108/0.7)]"
            />
            <Wordmark />
            <p className="text-[0.9375rem] leading-relaxed text-fg-2">
              {t.profile.aboutText}
            </p>
          </div>
          <ListGroup className="mb-5">
            <ListRow title={t.profile.version} value={BRAND.version} />
            <ListRow title={t.profile.build} value={BRAND.build} />
            <ListRow title={t.profile.platform} value={detectPlatform()} />
            <ListRow title={t.profile.storage} value={t.profile.storageValue} />
          </ListGroup>
          <ListGroup>
            <ListRow
              icon={<RotateCcw />}
              iconColor="#fc302a"
              title={t.profile.resetDemo}
              danger
              onClick={() => setConfirm(true)}
            />
          </ListGroup>
          <p className="mt-6 text-center text-[0.75rem] text-fg-3">
            © {new Date().getFullYear()} {BRAND.company}
          </p>
        </div>
      </ScrollArea>
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={reset}
        loading={busy}
        icon={<RotateCcw />}
        title={t.profile.resetDemoTitle}
        description={t.profile.resetDemoText}
        confirmLabel={t.profile.resetDemo}
        cancelLabel={t.common.cancel}
        variant="danger"
      />
    </Screen>
  );
}
