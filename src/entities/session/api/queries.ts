import { useMutation, useQueryClient } from "@tanstack/react-query";

import { type LoginResponse, api, qk, stopSimulation } from "@/shared/api";
import { useSession } from "@/shared/model";

export function useLogin() {
  const qc = useQueryClient();
  const setSession = useSession((s) => s.setSession);
  return useMutation({
    mutationFn: (v: { email: string; password: string; remember: boolean }) =>
      api.post<LoginResponse>("/auth/login", {
        email: v.email,
        password: v.password,
      }),
    meta: { silent: true },
    onSuccess: (res, v) => {
      qc.clear();
      qc.setQueryData(qk.me, res.user);
      setSession({
        token: res.token,
        userId: res.user.id,
        remember: v.remember,
      });
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  const clear = useSession((s) => s.clear);
  return useMutation({
    mutationFn: () => api.post("/auth/logout"),
    onSettled: () => {
      stopSimulation();
      clear();
      qc.clear();
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) => api.post("/auth/forgot", { email }),
    meta: { silent: true },
  });
}
