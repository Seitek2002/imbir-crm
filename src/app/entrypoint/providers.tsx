import type { ReactNode } from "react";
import { BrowserRouter } from "react-router";

import { QueryClientProvider } from "@tanstack/react-query";

import { queryClient } from "@/shared/api";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
}
