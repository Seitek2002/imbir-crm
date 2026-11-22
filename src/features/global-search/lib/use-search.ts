import { useNavigate } from "react-router";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { useCreateChat } from "@/entities/chat";

import {
  type ChatDTO,
  type MessageDTO,
  type SearchResult,
  type TaskDTO,
  type User,
  api,
  qk,
} from "@/shared/api";
import { useDebounced } from "@/shared/lib";
import { useSettings } from "@/shared/model";

export type SearchTab = "all" | "chats" | "people" | "tasks";

export function useSearch(query: string) {
  const q = useDebounced(query.trim(), 220);
  return useQuery({
    queryKey: qk.search(q),
    queryFn: () => api.get<SearchResult>("/search", { q }),
    enabled: q.length > 0,
    placeholderData: keepPreviousData,
    staleTime: 10_000,
  });
}

export type SearchItem =
  | { chat: ChatDTO; id: string; type: "chat" }
  | { chatTitle: string; id: string; message: MessageDTO; type: "message" }
  | { id: string; task: TaskDTO; type: "task" }
  | { id: string; type: "person"; user: User };

export function flattenResults(
  r: SearchResult | undefined,
  tab: SearchTab,
): SearchItem[] {
  if (!r) return [];
  const chats = r.chats.map((chat) => ({
    type: "chat" as const,
    id: `c-${chat.id}`,
    chat,
  }));
  const tasks = r.tasks.map((task) => ({
    type: "task" as const,
    id: `t-${task.id}`,
    task,
  }));
  const people = r.people.map((user) => ({
    type: "person" as const,
    id: `p-${user.id}`,
    user,
  }));
  const messages = r.messages.map((m) => ({
    type: "message" as const,
    id: `m-${m.message.id}`,
    message: m.message,
    chatTitle: m.chatTitle,
  }));
  if (tab === "chats") return [...chats, ...messages];
  if (tab === "tasks") return tasks;
  if (tab === "people") return people;
  return [
    ...chats.slice(0, 4),
    ...tasks.slice(0, 4),
    ...people.slice(0, 4),
    ...messages.slice(0, 6),
  ];
}

/** Переход к найденному: чат, задача или личка с человеком */
export function useOpenSearchItem(meId: string) {
  const navigate = useNavigate();
  const createChat = useCreateChat();
  const pushRecent = useSettings((s) => s.pushRecentSearch);
  return (item: SearchItem, query: string) => {
    if (query.trim()) pushRecent(query);
    switch (item.type) {
      case "chat":
        return navigate(`/chats/${item.chat.id}`);
      case "message":
        return navigate(`/chats/${item.message.chatId}`, {
          state: { highlight: item.message.id },
        });
      case "task":
        return navigate(`/tasks/${item.task.id}`);
      case "person":
        if (item.user.id === meId) return navigate("/profile");
        return createChat.mutate(
          { kind: "direct", memberIds: [item.user.id] },
          { onSuccess: (chat) => navigate(`/chats/${chat.id}`) },
        );
    }
  };
}
