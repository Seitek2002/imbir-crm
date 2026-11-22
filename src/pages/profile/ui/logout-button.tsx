import { useState } from "react";

import { LogOut } from "lucide-react";

import { useLogout } from "@/entities/session";

import { useT } from "@/shared/lib";
import { Button, ConfirmDialog } from "@/shared/ui";

export function LogoutButton({ className }: { className?: string }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const logout = useLogout();
  return (
    <>
      <Button
        variant="danger"
        block
        className={className}
        onClick={() => setOpen(true)}
      >
        {t.profile.logout}
      </Button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={() => logout.mutate()}
        loading={logout.isPending}
        icon={<LogOut />}
        title={t.profile.logoutTitle}
        description={t.profile.logoutText}
        confirmLabel={t.profile.logout}
        cancelLabel={t.common.cancel}
        variant="danger"
      />
    </>
  );
}
