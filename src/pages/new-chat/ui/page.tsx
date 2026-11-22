import { useNavigate, useSearchParams } from "react-router";

import { useT } from "@/shared/lib";
import { useSession } from "@/shared/model";
import { BackButton, NavBar, Screen } from "@/shared/ui";

import { NewChatForm } from "./new-chat-form";

export function NewChatPage() {
  const t = useT();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const meId = useSession((s) => s.userId) ?? "";
  const mode = params.get("mode") === "direct" ? "direct" : "group";

  return (
    <Screen>
      <NavBar
        title={mode === "group" ? t.newChat.group : t.newChat.direct}
        left={<BackButton fallback="/chats" />}
      />
      <NewChatForm
        meId={meId}
        initialMode={mode}
        onModeChange={(m) => setParams({ mode: m }, { replace: true })}
        onCreated={(id) => navigate(`/chats/${id}`, { replace: true })}
      />
    </Screen>
  );
}
