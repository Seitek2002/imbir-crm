import { useParams } from "react-router";

import { ChatInfoPanel } from "./chat-info-panel";

export function ChatInfoPage() {
  const { chatId = "" } = useParams();
  return <ChatInfoPanel chatId={chatId} />;
}
