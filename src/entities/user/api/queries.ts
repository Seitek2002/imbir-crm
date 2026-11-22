import { useMemo } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { type Department, type Me, type User, api, qk } from "@/shared/api";
import { useSession } from "@/shared/model";

export function useMe() {
  const token = useSession((s) => s.token);
  return useQuery({
    queryKey: qk.me,
    queryFn: () => api.get<Me>("/me"),
    enabled: Boolean(token),
    staleTime: 60_000,
  });
}

export function useUsers() {
  return useQuery({
    queryKey: qk.users,
    queryFn: () => api.get<User[]>("/users"),
    staleTime: 5 * 60_000,
  });
}

/** id → пользователь; удобно для рендера авторов сообщений и исполнителей */
export function useUserMap() {
  const { data } = useUsers();
  return useMemo(() => new Map((data ?? []).map((u) => [u.id, u])), [data]);
}

export function useDepartments() {
  return useQuery({
    queryKey: qk.departments,
    queryFn: () => api.get<Department[]>("/departments"),
    staleTime: Infinity,
  });
}

type ProfilePatch = Partial<
  Pick<User, "avatar" | "name" | "position" | "presence" | "showInitials">
>;

export function useUpdateMe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: ProfilePatch) => api.patch<Me>("/me", patch),
    onMutate: async (patch) => {
      await qc.cancelQueries({ queryKey: qk.me });
      const prev = qc.getQueryData<Me>(qk.me);
      if (prev) qc.setQueryData<Me>(qk.me, { ...prev, ...patch });
      return { prev };
    },
    onError: (_e, _v, ctx) => ctx?.prev && qc.setQueryData(qk.me, ctx.prev),
    onSuccess: (me) => {
      qc.setQueryData(qk.me, me);
      qc.setQueryData<User[]>(qk.users, (list) =>
        list?.map((u) => (u.id === me.id ? { ...u, ...me } : u)),
      );
      qc.invalidateQueries({ queryKey: qk.chats });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (v: { current: string; next: string }) =>
      api.post("/me/password", v),
    meta: { silent: true },
  });
}

export function useUpdateMutedDepartments() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (mutedDepartmentIds: string[]) =>
      api.patch<Me>("/me/departments", { mutedDepartmentIds }),
    onMutate: (ids) => {
      const prev = qc.getQueryData<Me>(qk.me);
      if (prev)
        qc.setQueryData<Me>(qk.me, { ...prev, mutedDepartmentIds: ids });
      return { prev };
    },
    onError: (_e, _v, ctx) => ctx?.prev && qc.setQueryData(qk.me, ctx.prev),
  });
}
