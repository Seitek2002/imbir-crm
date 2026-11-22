import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  type CommentDTO,
  type TaskDTO,
  type TaskInput,
  type TaskListParams,
  api,
  qk,
} from "@/shared/api";

export function useTasks(params: TaskListParams) {
  return useQuery({
    queryKey: qk.tasks(params),
    queryFn: () => api.get<TaskDTO[]>("/tasks", params),
    placeholderData: (prev) => prev,
  });
}

function findInLists(qc: ReturnType<typeof useQueryClient>, id: string) {
  for (const [, list] of qc.getQueriesData<TaskDTO[]>({
    queryKey: qk.tasksRoot,
  })) {
    const hit = list?.find((t) => t.id === id);
    if (hit) return hit;
  }
  return undefined;
}

export function useTask(id: string | undefined) {
  const qc = useQueryClient();
  return useQuery({
    queryKey: qk.task(id ?? ""),
    queryFn: () => api.get<TaskDTO>(`/tasks/${id}`),
    enabled: Boolean(id),
    initialData: () => (id ? findInLists(qc, id) : undefined),
    initialDataUpdatedAt: 0,
  });
}

/** Оптимистично применяет патч ко всем спискам задач и к карточке */
function patchTaskEverywhere(
  qc: ReturnType<typeof useQueryClient>,
  id: string,
  patch: Partial<TaskDTO>,
) {
  qc.setQueriesData<TaskDTO[]>({ queryKey: qk.tasksRoot }, (list) =>
    list?.map((t) => (t.id === id ? { ...t, ...patch } : t)),
  );
  qc.setQueryData<TaskDTO>(qk.task(id), (t) => (t ? { ...t, ...patch } : t));
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: TaskInput) => api.post<TaskDTO>("/tasks", input),
    onSuccess: (task) => {
      qc.setQueryData(qk.task(task.id), task);
      qc.invalidateQueries({ queryKey: qk.tasksRoot });
      qc.invalidateQueries({ queryKey: qk.me });
    },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<TaskInput> }) =>
      api.patch<TaskDTO>(`/tasks/${id}`, patch),
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: qk.tasksRoot });
      const prevTask = qc.getQueryData<TaskDTO>(qk.task(id));
      patchTaskEverywhere(qc, id, patch);
      return { prevTask };
    },
    onError: (_e, { id }, ctx) => {
      if (ctx?.prevTask) patchTaskEverywhere(qc, id, ctx.prevTask);
    },
    onSuccess: (task) => qc.setQueryData(qk.task(task.id), task),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: qk.tasksRoot });
      qc.invalidateQueries({ queryKey: qk.me });
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/tasks/${id}`),
    onMutate: (id) => {
      qc.setQueriesData<TaskDTO[]>({ queryKey: qk.tasksRoot }, (list) =>
        list?.filter((t) => t.id !== id),
      );
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: qk.tasksRoot });
      qc.invalidateQueries({ queryKey: qk.me });
    },
  });
}

export function useComments(taskId: string | undefined) {
  return useQuery({
    queryKey: qk.comments(taskId ?? ""),
    queryFn: () => api.get<CommentDTO[]>(`/tasks/${taskId}/comments`),
    enabled: Boolean(taskId),
  });
}

export function useAddComment(taskId: string, meId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { replyToId?: null | string; text: string }) =>
      api.post<CommentDTO>(`/tasks/${taskId}/comments`, v),
    onMutate: async (v) => {
      await qc.cancelQueries({ queryKey: qk.comments(taskId) });
      const tempId = `tmp-${Date.now()}`;
      const list = qc.getQueryData<CommentDTO[]>(qk.comments(taskId)) ?? [];
      const reply = v.replyToId
        ? list.find((c) => c.id === v.replyToId)
        : undefined;
      const temp: CommentDTO = {
        id: tempId,
        taskId,
        authorId: meId,
        text: v.text,
        createdAt: new Date().toISOString(),
        replyTo: reply
          ? { id: reply.id, authorId: reply.authorId, text: reply.text }
          : null,
        pinned: false,
      };
      qc.setQueryData<CommentDTO[]>(qk.comments(taskId), [...list, temp]);
      return { tempId };
    },
    onSuccess: (c, _v, ctx) => {
      qc.setQueryData<CommentDTO[]>(qk.comments(taskId), (list) =>
        (list ?? []).map((x) => (x.id === ctx?.tempId ? c : x)),
      );
      patchTaskEverywhere(qc, taskId, {});
      qc.invalidateQueries({ queryKey: qk.tasksRoot });
    },
    onError: (_e, _v, ctx) => {
      qc.setQueryData<CommentDTO[]>(qk.comments(taskId), (list) =>
        (list ?? []).filter((x) => x.id !== ctx?.tempId),
      );
    },
  });
}

export function useDeleteComment(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/comments/${id}`),
    onMutate: (id) => {
      qc.setQueryData<CommentDTO[]>(qk.comments(taskId), (list) =>
        list?.filter((c) => c.id !== id),
      );
    },
  });
}

export function usePinComment(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, pinned }: { id: string; pinned: boolean }) =>
      api.post<CommentDTO>(`/comments/${id}/pin`, { pinned }),
    onMutate: ({ id, pinned }) => {
      qc.setQueryData<CommentDTO[]>(qk.comments(taskId), (list) =>
        list?.map((c) => (c.id === id ? { ...c, pinned } : c)),
      );
    },
  });
}
