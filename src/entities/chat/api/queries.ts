import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  type ChatBulkAction,
  type ChatDTO,
  type CreateChatInput,
  api,
  qk,
} from "@/shared/api";

export function useChats() {
  return useQuery({
    queryKey: qk.chats,
    queryFn: () => api.get<ChatDTO[]>("/chats"),
  });
}

/** Чат по id: мгновенно из кэша списка, затем уточняется запросом */
export function useChat(id: string | undefined) {
  const qc = useQueryClient();
  return useQuery({
    queryKey: qk.chat(id ?? ""),
    queryFn: () => api.get<ChatDTO>(`/chats/${id}`),
    enabled: Boolean(id),
    initialData: () =>
      qc.getQueryData<ChatDTO[]>(qk.chats)?.find((c) => c.id === id),
    initialDataUpdatedAt: () => qc.getQueryState(qk.chats)?.dataUpdatedAt,
  });
}

/** Точечно правит чат в кэше списка и в кэше самого чата */
export function patchChatCache(
  qc: ReturnType<typeof useQueryClient>,
  ids: string[],
  patch: (c: ChatDTO) => ChatDTO | null,
) {
  qc.setQueryData<ChatDTO[]>(qk.chats, (list) =>
    list
      ?.map((c) => (ids.includes(c.id) ? patch(c) : c))
      .filter((c): c is ChatDTO => c !== null),
  );
  for (const id of ids) {
    qc.setQueryData<ChatDTO>(qk.chat(id), (c) => (c ? (patch(c) ?? c) : c));
  }
}

type StatePatch = Partial<Pick<ChatDTO, "archived" | "muted" | "pinned">>;

function sortList(list: ChatDTO[]) {
  return [...list].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.activityAt.localeCompare(a.activityAt);
  });
}

export function useUpdateChatState() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: StatePatch }) =>
      api.patch<ChatDTO>(`/chats/${id}/state`, patch),
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: qk.chats, exact: true });
      const prev = qc.getQueryData<ChatDTO[]>(qk.chats);
      patchChatCache(qc, [id], (c) => ({ ...c, ...patch }));
      qc.setQueryData<ChatDTO[]>(qk.chats, (l) => (l ? sortList(l) : l));
      return { prev };
    },
    onError: (_e, _v, ctx) => ctx?.prev && qc.setQueryData(qk.chats, ctx.prev),
  });
}

export function useMarkChatRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/chats/${id}/read`),
    onMutate: (id) =>
      patchChatCache(qc, [id], (c) => ({ ...c, unreadCount: 0 })),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.notifications }),
  });
}

export function useBulkChats() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, action }: { action: ChatBulkAction; ids: string[] }) =>
      api.post("/chats/bulk", { ids, action }),
    onMutate: async ({ ids, action }) => {
      await qc.cancelQueries({ queryKey: qk.chats, exact: true });
      const prev = qc.getQueryData<ChatDTO[]>(qk.chats);
      patchChatCache(qc, ids, (c) => {
        if (action === "delete") return null;
        if (action === "read") return { ...c, unreadCount: 0 };
        return {
          ...c,
          archived: action === "archive",
          pinned: action === "archive" ? false : c.pinned,
        };
      });
      return { prev };
    },
    onError: (_e, _v, ctx) => ctx?.prev && qc.setQueryData(qk.chats, ctx.prev),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: qk.chats });
      qc.invalidateQueries({ queryKey: qk.notifications });
    },
  });
}

export function useCreateChat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateChatInput) => api.post<ChatDTO>("/chats", input),
    onSuccess: (chat) => {
      qc.setQueryData(qk.chat(chat.id), chat);
      qc.setQueryData<ChatDTO[]>(qk.chats, (l) =>
        l ? sortList([chat, ...l.filter((c) => c.id !== chat.id)]) : l,
      );
    },
  });
}

export function useLeaveChat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/chats/${id}/leave`),
    onSuccess: (_r, id) => patchChatCache(qc, [id], () => null),
  });
}
