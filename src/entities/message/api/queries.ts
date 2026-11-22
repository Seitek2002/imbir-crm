import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  type ChatDTO,
  type MessageDTO,
  type SendMessageInput,
  api,
  qk,
} from "@/shared/api";
import { uid } from "@/shared/lib";

/** Сообщение в кэше клиента: может быть ещё «в пути» */
export type UiMessage = MessageDTO & { pending?: boolean };

export function useMessages(chatId: string | undefined) {
  return useQuery({
    queryKey: qk.messages(chatId ?? ""),
    queryFn: () => api.get<UiMessage[]>(`/chats/${chatId}/messages`),
    enabled: Boolean(chatId),
  });
}

export function prefetchMessages(
  qc: ReturnType<typeof useQueryClient>,
  chatId: string,
) {
  return qc.prefetchQuery({
    queryKey: qk.messages(chatId),
    queryFn: () => api.get<UiMessage[]>(`/chats/${chatId}/messages`),
    staleTime: 30_000,
  });
}

/**
 * Отправка с оптимистичным обновлением: сообщение появляется сразу
 * (с часиками), после ответа сервера заменяется настоящим.
 */
export function useSendMessage(chatId: string, meId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SendMessageInput) =>
      api.post<MessageDTO>(`/chats/${chatId}/messages`, input),
    onMutate: async (input) => {
      const clientId = input.clientId ?? uid("tmp");
      input.clientId = clientId;
      await qc.cancelQueries({ queryKey: qk.messages(chatId) });
      const temp: UiMessage = {
        id: clientId,
        chatId,
        authorId: meId,
        kind: input.kind ?? (input.attachment ? "file" : "text"),
        text: input.text,
        createdAt: new Date().toISOString(),
        replyTo: null,
        attachment: input.attachment ?? null,
        call: null,
        taskEvent: null,
        status: "sent",
        pinned: false,
        clientId,
        pending: true,
      };
      if (input.replyToId) {
        const src = qc
          .getQueryData<UiMessage[]>(qk.messages(chatId))
          ?.find((m) => m.id === input.replyToId);
        if (src)
          temp.replyTo = {
            id: src.id,
            authorId: src.authorId,
            kind: src.kind,
            text: src.text || src.attachment?.name || "",
          };
      }
      qc.setQueryData<UiMessage[]>(qk.messages(chatId), (list) => [
        ...(list ?? []),
        temp,
      ]);
      const touch = (c: ChatDTO): ChatDTO => ({
        ...c,
        lastMessage: temp,
        activityAt: temp.createdAt,
        unreadCount: 0,
      });
      qc.setQueryData<ChatDTO[]>(qk.chats, (list) => {
        if (!list) return list;
        const updated = list.map((c) => (c.id === chatId ? touch(c) : c));
        return updated.sort((a, b) =>
          a.pinned !== b.pinned
            ? a.pinned
              ? -1
              : 1
            : b.activityAt.localeCompare(a.activityAt),
        );
      });
      return { clientId };
    },
    onSuccess: (msg, _input, ctx) => {
      qc.setQueryData<UiMessage[]>(qk.messages(chatId), (list) => {
        const rest = (list ?? []).filter(
          (m) => m.id !== ctx?.clientId && m.id !== msg.id,
        );
        return [...rest, msg].sort((a, b) =>
          a.createdAt.localeCompare(b.createdAt),
        );
      });
      qc.invalidateQueries({ queryKey: qk.chats });
    },
    onError: (_e, _input, ctx) => {
      qc.setQueryData<UiMessage[]>(qk.messages(chatId), (list) =>
        (list ?? []).filter((m) => m.id !== ctx?.clientId),
      );
    },
  });
}

export function useDeleteMessage(chatId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/messages/${id}`),
    onMutate: (id) => {
      const prev = qc.getQueryData<UiMessage[]>(qk.messages(chatId));
      qc.setQueryData<UiMessage[]>(qk.messages(chatId), (list) =>
        list?.filter((m) => m.id !== id),
      );
      return { prev };
    },
    onError: (_e, _id, ctx) =>
      ctx?.prev && qc.setQueryData(qk.messages(chatId), ctx.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: qk.chats }),
  });
}

export function usePinMessage(chatId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, pinned }: { id: string; pinned: boolean }) =>
      api.post<MessageDTO>(`/messages/${id}/pin`, { pinned }),
    onMutate: ({ id, pinned }) => {
      qc.setQueryData<UiMessage[]>(qk.messages(chatId), (list) =>
        list?.map((m) => (m.id === id ? { ...m, pinned } : m)),
      );
    },
    onSettled: () => qc.invalidateQueries({ queryKey: qk.chats }),
  });
}
