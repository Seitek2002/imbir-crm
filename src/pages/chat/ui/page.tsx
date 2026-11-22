import { useParams } from "react-router";

import { ChatView } from "./chat-view";

export function ChatPage() {
  const { chatId = "" } = useParams();
  // key — новый чат открывается с чистым состоянием (скролл, ответ, подсветка)
  return <ChatView key={chatId} chatId={chatId} />;
}
