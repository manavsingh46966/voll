import { useInfiniteQuery } from "@tanstack/react-query";

import { fetchEventsApi } from "../api/event.api";
import type { EventItem, FindEventsRequest } from "../types";

const PAGE_SIZE = 10;

/**
 * Hook for infinite-scroll paginated event fetching.
 * Uses TanStack Query's `useInfiniteQuery` with cursor-based pagination
 * (cursor = ISO date string of the oldest event in last page).
 *
 * @returns Paginated events data, loading/error states, and `fetchNextPage` trigger.
 */
export function useEvents(params?: Partial<FindEventsRequest>) {
  return useInfiniteQuery<EventItem[], Error>({
    queryKey: ["events", "feed", params],
    queryFn: async ({ pageParam }) => {
      const cursor = pageParam as string | undefined;
      const response = await fetchEventsApi({
        ...params,
        cursor,
        limit: params?.limit ?? PAGE_SIZE,
      });
      return response.data;
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      // If fewer than PAGE_SIZE items returned, no more pages
      const limit = params?.limit ?? PAGE_SIZE;
      if (lastPage.length < limit) return undefined;
      // Cursor = fromDateTime of the last item (server sorts desc by fromDateTime)
      const last = lastPage[lastPage.length - 1];
      return last?.fromDateTime;
    },
  });
}
