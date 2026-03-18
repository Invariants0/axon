"use client";

// ============================================================
// components/providers.tsx
// All client-side providers in one place.
// Keep this file lean — just wiring, no business logic.
// ============================================================

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

// ─── React Query configuration ──────────────────────────────
// Production-tuned defaults matching our stale times and retry behavior

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Don't retry on auth errors
        retry: (failureCount, error) => {
          if (error instanceof Error && error.message.includes("401")) return false;
          if (error instanceof Error && error.message.includes("403")) return false;
          return failureCount < 2;
        },
        // Don't refetch on window focus for real-time data (we use WebSocket)
        refetchOnWindowFocus: false,
        // Data considered fresh for at least 10s
        staleTime: 10_000,
        // Keep inactive queries in cache for 5 minutes
        gcTime: 5 * 60 * 1000,
      },
      mutations: {
        retry: 0, // Never auto-retry mutations
      },
    },
  });
}

export function Providers({ children }: { children: ReactNode }) {
  // useState ensures QueryClient is not shared between requests (SSR safe)
  const [queryClient] = useState(() => makeQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
