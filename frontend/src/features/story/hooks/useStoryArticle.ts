import { useCallback, useEffect, useRef } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useSessionStore } from "@/src/stores/session.store";

import {
  getStoryBySlugApi,
  recordStoryReadApi,
  recordStoryViewApi,
} from "../api/stories.api";
import { StoryDetail } from "../types/story.types";

/**
 * Custom hook to load a single article by its URL slug and manage its analytics.
 * 1. TanStack Query Replacement: Completely removes fragile `useEffect`/`useState` chains
 * for data fetching. Automatic caching, retry logic, and stale-time management.
 * 2. Cache Isolation: Includes `userId` in the Query Key to prevent authenticated states
 * (like `isLiked`) from leaking into public or other user sessions.
 * 3. Strict Mode Safe Analytics: Retains `useRef` guards to ensure view/read analytics
 * don't double-fire during React 18+ development strict-mode mount/unmount cycles.
 *
 * @param slug - The URL-friendly identifier for the story.
 * @returns Object containing the article data, loading/error states, and interaction methods.
 */
export const useStoryArticle = (slug?: string) => {
  const queryClient = useQueryClient();
  const userId = useSessionStore((state) => state.user?.id);

  // Refs to prevent duplicate analytics calls during the session lifetime of this component
  const hasRecordedView = useRef(false);
  const hasRecordedRead = useRef(false);

  // CRITICAL SECURITY: Append userId to isolate the cache per user
  const queryKey = ["story", "article", slug, userId];

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      // The API client will throw an error if it fails, which React Query catches automatically
      return await getStoryBySlugApi(slug as string);
    },
    // Only run the query if a slug actually exists
    enabled: !!slug,
  });

  /**
   * Analytics Effect: Record a "View" as soon as the data successfully loads.
   * Decoupled from the fetch logic so React Query handles caching, while this
   * purely handles the side-effect of the user seeing the loaded content.
   */
  useEffect(() => {
    // If the slug changes, reset our analytics locks for the new article
    hasRecordedView.current = false;
    hasRecordedRead.current = false;
  }, [slug]);

  useEffect(() => {
    if (query.data?.id && !hasRecordedView.current) {
      hasRecordedView.current = true;
      recordStoryViewApi(query.data.id).catch((error: unknown) => {
        console.warn("[story] Failed to record view", error);
      });
    }
  }, [query.data?.id]);

  /**
   * Triggers the API to record a "Read".
   * This should be called by the UI when the user scrolls to the bottom of the article
   * or spends a certain amount of time on the screen.
   */
  const trackArticleRead = useCallback(() => {
    if (query.data?.id && !hasRecordedRead.current) {
      hasRecordedRead.current = true;
      recordStoryReadApi(query.data.id).catch((error: unknown) => {
        console.warn("[story] Failed to record read", error);
      });
    }
  }, [query.data?.id]);

  /**
   * Optimistically updates the cached like count and boolean state for this specific article.
   * Modifies the React Query cache directly so the UI responds instantly without a network waterfall.
   *
   * @param likeCount - The new total number of likes.
   * @param isLiked - The updated boolean indicating if the current user likes it.
   */
  const updateStoryLike = useCallback(
    (likeCount: number, isLiked: boolean) => {
      queryClient.setQueryData<StoryDetail>(queryKey, (oldData) => {
        if (!oldData) return oldData;
        // Standard immutable update pattern
        return {
          ...oldData,
          likeCount,
          isLiked,
        };
      });
    },
    [queryClient, queryKey],
  );

  return {
    story: query.data ?? null,
    isLoading: query.isLoading,
    // Extract a clean string error message if the query fails
    error: query.error ? query.error.message : null,
    updateStoryLike,
    trackArticleRead,
  };
};
