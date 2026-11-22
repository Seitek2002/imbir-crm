import { useEffect, useRef } from "react";
import { useLocation } from "react-router";

import { useQueryClient } from "@tanstack/react-query";

import { messagePreview, useTyping } from "@/entities/chat";
import { firstName } from "@/entities/user";

import {
  type ChatDTO,
  DB_STORAGE_KEY,
  type User,
  api,
  qk,
  realtime,
  reloadFromStorage,
  startSimulation,
} from "@/shared/api";
import { getT, haptic } from "@/shared/lib";
import { useSession, useToasts } from "@/shared/model";

/**
 * Связь «сервер → клиент»: события мок-сокета превращаются в инвалидацию
 * кэша, индикатор набора текста и баннеры о новых сообщениях.
 */
export function RealtimeBridge() {
  const qc = useQueryClient();
  const userId = useSession((s) => s.userId);
  const location = useLocation();
  const pathRef = useRef(location.pathname);
  useEffect(() => {
    pathRef.current = location.pathname;
  }, [location.pathname]);
  const setTyping = useTyping((s) => s.setTyping);
  const showBanner = useToasts((s) => s.showBanner);

  useEffect(() => {
    if (!userId) return;
    startSimulation(userId);

    const announce = async (chatId: string, authorId: string) => {
      if (
        pathRef.current.startsWith(`/chats/${chatId}`) ||
        document.visibilityState !== "visible"
      )
        return;
      const chats = await qc.fetchQuery({
        queryKey: qk.chats,
        queryFn: () => api.get<ChatDTO[]>("/chats"),
        staleTime: 0,
      });
      const chat = chats.find((c) => c.id === chatId);
      if (!chat || chat.muted || !chat.lastMessage) return;
      const author = qc
        .getQueryData<User[]>(qk.users)
        ?.find((u) => u.id === authorId);
      const text = messagePreview(chat.lastMessage, getT());
      haptic("light");
      showBanner({
        title:
          chat.kind === "direct" ? (author?.name ?? chat.title) : chat.title,
        text:
          chat.kind === "direct" || !author
            ? text
            : `${firstName(author.name)}: ${text}`,
        avatar: chat.kind === "direct" && author ? author.avatar : chat.avatar,
        avatarName: chat.title,
        href: `/chats/${chat.id}`,
      });
    };

    const unsubscribe = realtime.subscribe((e) => {
      switch (e.type) {
        case "message:new":
          qc.invalidateQueries({ queryKey: qk.messages(e.chatId) });
          qc.invalidateQueries({ queryKey: qk.chats });
          if (e.authorId && e.authorId !== userId) {
            setTyping(e.chatId, e.authorId, false);
            void announce(e.chatId, e.authorId);
          }
          break;
        case "chat:typing":
          setTyping(e.chatId, e.userId, e.typing);
          break;
        case "chats:changed":
          qc.invalidateQueries({ queryKey: qk.chats });
          if (e.chatId)
            qc.invalidateQueries({ queryKey: qk.messages(e.chatId) });
          else qc.invalidateQueries({ queryKey: ["messages"] });
          break;
        case "tasks:changed":
          qc.invalidateQueries({ queryKey: qk.tasksRoot });
          qc.invalidateQueries({ queryKey: ["task"] });
          qc.invalidateQueries({ queryKey: qk.me });
          break;
        case "comments:changed":
          qc.invalidateQueries({ queryKey: qk.comments(e.taskId) });
          qc.invalidateQueries({ queryKey: qk.task(e.taskId) });
          break;
        case "notifications:changed":
          qc.invalidateQueries({ queryKey: qk.notifications });
          break;
        case "stories:changed":
          qc.invalidateQueries({ queryKey: qk.stories });
          break;
        case "me:changed":
          qc.invalidateQueries({ queryKey: qk.me });
          qc.invalidateQueries({ queryKey: qk.users });
          break;
        case "reset":
          qc.invalidateQueries();
          break;
      }
    });
    return unsubscribe;
  }, [qc, userId, setTyping, showBanner]);

  // Другая вкладка изменила «базу» — перечитываем и обновляем экран
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== DB_STORAGE_KEY) return;
      reloadFromStorage();
      qc.invalidateQueries();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [qc]);

  return null;
}
