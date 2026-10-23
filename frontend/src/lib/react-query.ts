import { QueryClient } from "@tanstack/react-query";

/**
 * Global Query Client for TanStack Query.
 * Configured with aggressive caching to minimize backend load.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      /**
       * STALE TIME (1 Minute)
       * The data is considered "fresh" for 1 minute.
       * If the user switches screens and comes back within 1m,
       * the cached data is shown instantly without a background refetch.
       */
      staleTime: 1000 * 60 * 1,

      /**
       * GC TIME (5 Minutes)
       * If a query is unused (unmounted) for 5 minutes,
       * it is garbage collected from memory.
       */
      gcTime: 1000 * 60 * 5,

      /**
       * RETRY STRATEGY
       * If a request fails, retry it 2 times before throwing an error.
       * Useful for spotty mobile connections.
       */
      retry: 2,

      /**
       * REFETCH ON WINDOW FOCUS
       * Disabled for mobile apps to prevent unnecessary fetching
       * when the user pulls down the notification shade.
       */
      refetchOnWindowFocus: false,
    },
  },
});
