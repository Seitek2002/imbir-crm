import { useNavigate } from "react-router";

import { MessagesSquare, UsersRound } from "lucide-react";

import { EmptyPane } from "@/widgets/app-shell";

import { useMe } from "@/entities/user";

import { useT } from "@/shared/lib";
import { Button } from "@/shared/ui";

import { ChatListPanel } from "./chat-list-panel";

export function ChatsPage() {
  return <ChatListPanel />;
}

/** Правая панель десктопа, пока чат не выбран */
export function ChatsEmptyPane() {
  const t = useT();
  const navigate = useNavigate();
  const { data: me } = useMe();
  return (
    <EmptyPane
      icon={<MessagesSquare />}
      title={me ? t.desktop.welcome(me.name.split(" ")[0]) : t.chats.title}
      text={t.chats.selectChat}
      hint={t.search.hint}
      action={
        <Button
          size="md"
          variant="secondary"
          icon={<UsersRound className="size-4" />}
          onClick={() => navigate("/chats/new?mode=group")}
        >
          {t.newChat.group}
        </Button>
      }
    />
  );
}
