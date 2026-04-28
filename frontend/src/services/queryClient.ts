// @ts-nocheck
/**
 * TanStack Query Client Configuration
 * 
 * Central QueryClient instance for TanStack Query (React Query).
 * Used by the QueryClientProvider in the app entry point.
 * 
 * Default options:
 * - staleTime: 30s — data is considered fresh for 30 seconds
 * - retry: 1 — retry failed requests once
 * - refetchOnWindowFocus: false — disable auto-refetch on tab focus
 */
import { QueryClient } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default queryClient;
