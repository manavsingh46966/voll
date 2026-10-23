import {
  InfiniteData,
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { produce } from "immer";

import { getApiErrorMessage } from "@/src/lib/axios";
import { useSessionStore } from "@/src/stores/session.store";

import { getStoriesApi } from "../api/stories.api";
import { StorySummary } from "../types/story.types";

/**
 * Custom hook to fetch, cache, and manage the paginated story feed.
 * Completely replaces the old Zustand store with TanStack Query for offline-first,
 * highly performant data fetching and caching.
 *
 * @param {string} [authorId] - Optional filter. If provided, fetches only stories by this author.
 * @returns An object containing the flattened stories array, loading states, and cache mutation functions.
 */
export const useStoryFeed = (authorId?: string) => {
  const queryClient = useQueryClient();
  const userId = useSessionStore((state) => state.user?.id);

  // CRITICAL SECURITY: Include `userId` in the query key so caches are strictly isolated per user.
  const queryKey = ["stories", "feed", authorId || "global", userId];

  const query = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam }) => {
      return await getStoriesApi(pageParam as string | undefined, 10, authorId);
    },
    getNextPageParam: (lastPage) => {
      // If the last page returned is empty, there are no more stories to fetch.
      if (!lastPage || lastPage.length === 0) return undefined;
      // The cursor for the next page is the `createdAt` timestamp of the very last story.
      return lastPage[lastPage.length - 1].createdAt;
    },
    initialPageParam: undefined as string | undefined,
  });

  /**
   * Optimistically removes a story from the infinite query cache.
   * Useful when a user deletes their own story, avoiding a full feed refetch.
   *
   * @param {string} storyId - The ID of the story to remove.
   */
  const removeStoryFromFeed = (storyId: string) => {
    queryClient.setQueryData<InfiniteData<StorySummary[]>>(
      queryKey,
      (oldData) => {
        if (!oldData) return oldData;
        return produce(oldData, (draft) => {
          for (const page of draft.pages) {
            const index = page.findIndex((s) => s.id === storyId);
            if (index !== -1) {
              page.splice(index, 1);
              break;
            }
          }
        });
      },
    );
  };

  /**
   * Optimistically updates the like state of a story in the local cache.
   * Matches the exact signature required by the StoriesScreen handler.
   *
   * @param {string} storyId - The ID of the story to update.
   * @param {number} likeCount - The manually calculated next like count.
   * @param {boolean} isLiked - The manually calculated next liked state.
   */
  const updateLikeState = (
    storyId: string,
    likeCount: number,
    isLiked: boolean,
  ) => {
    queryClient.setQueryData<InfiniteData<StorySummary[]>>(
      queryKey,
      (oldData) => {
        if (!oldData) return oldData;
        return produce(oldData, (draft) => {
          for (const page of draft.pages) {
            const story = page.find((s) => s.id === storyId);
            if (story) {
              story.isLiked = isLiked;
              story.likeCount = likeCount;
              break;
            }
          }
        });
      },
    );
  };

  return {
    // Flatten the array of pages into a single 1D array of stories for the UI components
    stories: query.data?.pages.flat() ?? [],

    // Core React Query states mapped to match the previous API expected by your screens
    isLoading: query.isLoading,
    isFetchingMore: query.isFetchingNextPage,
    isRefreshing: query.isRefetching && !query.isFetchingNextPage,
    hasMore: query.hasNextPage,

    // Transform the raw React Query Error Object into a readable string
    // using your existing axios utility so the UI <Text> component doesn't crash.
    error: query.error
      ? getApiErrorMessage(query.error, "Failed to load stories.")
      : null,

    // Actions
    loadStories: query.refetch, // Exported to satisfy the UI's 'Retry' button
    loadNextPage: query.fetchNextPage,
    refreshStories: query.refetch,

    // Optimistic Cache Manipulations
    removeStoryFromFeed,
    updateLikeState, // Updated to handle the 3 parameters the screen sends
  };
};
