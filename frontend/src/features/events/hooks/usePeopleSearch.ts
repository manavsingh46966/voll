import { useQuery } from "@tanstack/react-query";

import { fetchPeopleSearchApi } from "../api/event.api";
import type { Person } from "../types";

/**
 * Hook for searching people by name or email.
 * Mirrors old_vol PeopleSearch but uses TanStack Query.
 *
 * @param {string} search - The search string.
 * @returns Query result with matching users.
 */
export function usePeopleSearch(search: string) {
  return useQuery<Person[], Error>({
    queryKey: ["people", "search", search],
    queryFn: async () => {
      const response = await fetchPeopleSearchApi(search);
      return response.data;
    },
    enabled: search.trim().length > 0,
  });
}
