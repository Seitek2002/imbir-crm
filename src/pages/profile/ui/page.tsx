import { useNavigate } from "react-router";

import { UserRound } from "lucide-react";

import { EmptyPane } from "@/widgets/app-shell";

import { useMe } from "@/entities/user";

import { useT } from "@/shared/lib";
import { Button } from "@/shared/ui";

import { ProfilePanel } from "./profile-panel";

export function ProfilePage() {
  return <ProfilePanel />;
}

export function ProfileEmptyPane() {
  const t = useT();
  const navigate = useNavigate();
  const { data: me } = useMe();
  return (
    <EmptyPane
      icon={<UserRound />}
      title={me ? t.desktop.welcome(me.name.split(" ")[0]) : t.profile.title}
      text={me ? `${me.position} · ${me.email}` : ""}
      action={
        <Button
          size="md"
          variant="secondary"
          onClick={() => navigate("/profile/account")}
        >
          {t.profile.account}
        </Button>
      }
    />
  );
}
