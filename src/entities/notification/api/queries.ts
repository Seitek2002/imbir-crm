import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { type NotificationDTO, api, qk } from "@/shared/api";

export function useNotifications() {
  return useQuery({
    queryKey: qk.notifications,
    queryFn: () => api.get<NotificationDTO[]>("/notifications"),
  });
}

export function useUnreadNotificationsCount() {
  const { data } = useNotifications();
  return data?.filter((n) => !n.read).length ?? 0;
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/notifications/${id}/read`),
    onMutate: (id) =>
      qc.setQueryData<NotificationDTO[]>(qk.notifications, (l) =>
        l?.map((n) => (n.id === id ? { ...n, read: true } : n)),
      ),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post("/notifications/read-all"),
    onMutate: () =>
      qc.setQueryData<NotificationDTO[]>(qk.notifications, (l) =>
        l?.map((n) => ({ ...n, read: true })),
      ),
  });
}
