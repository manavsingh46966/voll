import { useMemo } from "react";

import { useInfiniteQuery } from "@tanstack/react-query";

import { getApiErrorMessage } from "@/src/lib/axios";
import { useSessionStore } from "@/src/stores/session.store";

import { fetchEventsFeedApi } from "../api/event.api";
import type { Event } from "../types/event.types";

const PAGE_SIZE = 10;

interface UseEventsFeedResult {
  events: Event[];
  isLoading: boolean;
  isRefreshing: boolean;
  isFetchingNextPage: boolean;
  error: string | null;
  refresh: () => void;
  loadMore: () => void;
}

/**
 * Loads the published events feed with cursor pagination.
 * The cursor is the `fromDateTime` of the last event on the previous page.
 *
 * @returns The flattened events list, loading flags, and refresh/load-more actions.
 */
export const useEventsFeed = (): UseEventsFeedResult => {
  // The feed is personalised (isJoined / isPending), so isolate the cache per user.
  const userId = useSessionStore((state) => state.user?.id);

  const query = useInfiniteQuery({
    queryKey: ["events", "feed", userId],
    queryFn: ({ pageParam }) =>
      fetchEventsFeedApi({ cursor: pageParam, limit: PAGE_SIZE }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.length < PAGE_SIZE
        ? undefined
        : lastPage[lastPage.length - 1].fromDateTime,
  });

  const events = useMemo(() => {
    const seen = new Set<string>();
    return (query.data?.pages.flat() ?? []).filter((event) => {
      if (seen.has(event._id)) return false;
      seen.add(event._id);
      return true;
    });
  }, [query.data]);

  const { hasNextPage, isFetchingNextPage, fetchNextPage, refetch } = query;

  return {
    events,
    isLoading: query.isLoading,
    isRefreshing: query.isRefetching && !isFetchingNextPage,
    isFetchingNextPage,
    error: query.error
      ? getApiErrorMessage(
          query.error,
          "Some error occurred. Please try again.",
        )
      : null,
    refresh: () => void refetch(),
    loadMore: () => {
      if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
    },
  };
};
