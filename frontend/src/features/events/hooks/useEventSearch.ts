import { useQuery } from "@tanstack/react-query";

import { fetchEventsApi } from "../api/event.api";
import type { EventItem } from "../types";

/**
 * Hook for searching events by a text query.
 * Mirrors old_vol EventSearch but uses TanStack Query.
 *
 * @param {string} search - The search string.
 * @returns Query result with matching events.
 */
export function useEventSearch(search: string) {
  return useQuery<EventItem[], Error>({
    queryKey: ["events", "search", search],
    queryFn: async () => {
      const response = await fetchEventsApi({ search, limit: 50 });
      return response.data;
    },
    enabled: search.trim().length > 0,
  });
}
