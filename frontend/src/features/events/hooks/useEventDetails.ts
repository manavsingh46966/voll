import { useQuery } from "@tanstack/react-query";

import { fetchEventDetailsApi } from "../api/event.api";
import type { EventItem } from "../types";

/**
 * Hook to fetch full event details for a single event.
 * Uses TanStack Query with caching keyed by eventId.
 *
 * @param {string} eventId - The MongoDB ObjectId event identifier.
 * @returns {object} Query result containing event data, loading/error states.
 */
export function useEventDetails(eventId: string) {
  return useQuery<EventItem, Error>({
    queryKey: ["event", "details", eventId],
    queryFn: async () => {
      const response = await fetchEventDetailsApi(eventId);
      return response.data;
    },
    enabled: eventId.length > 0,
    staleTime: 1000 * 60 * 2,
    // Poll every 5 s while the user's request is pending (matches old_vol polling behavior)
    refetchInterval: (query) =>
      query.state.data?.isPending === true ? 5000 : false,
  });
}
