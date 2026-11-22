import { MutationCache, QueryClient } from "@tanstack/react-query";

import { getT } from "../lib/i18n";
import { toast } from "../model/toast";
import { ApiError } from "./client";

export function errorMessage(error: unknown) {
  const t = getT();
  if (error instanceof ApiError) {
    if (error.status === 507) return t.common.storageFull;
    if (error.status >= 500) return t.common.networkError;
  }
  return t.common.error;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 10 * 60_000,
      retry: (count, error) =>
        !(error instanceof ApiError && error.status < 500) && count < 2,
      refetchOnWindowFocus: false,
    },
  },
  mutationCache: new MutationCache({
    onError: (error, _vars, _ctx, mutation) => {
      // Мутации с собственной обработкой (форма логина и т.п.) помечают себя meta.silent
      if (mutation.meta?.silent) return;
      toast.error(errorMessage(error));
    },
  }),
});
