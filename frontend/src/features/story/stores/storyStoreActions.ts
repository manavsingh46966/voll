import { getApiErrorMessage } from "@/src/lib/axios";
import { withRetry } from "@/src/lib/retry";

import { getStoriesApi } from "../api/stories.api";
import { StoryDetail, StorySummary } from "../types/story.types";
import { StoryFeedState } from "../types/storyStore.types";
import {
  isCacheExpired,
  mergeLikedState,
  persistCache,
  persistLikedIds,
  readLikedIds,
  restoreCache,
  STORIES_PAGE_SIZE,
} from "../utils/storyFeedCache";

type SetState = (
  partial:
    | Partial<StoryFeedState>
    | ((state: StoryFeedState) => Partial<StoryFeedState>),
) => void;
type GetState = () => StoryFeedState;

const getNextCursor = (stories: StorySummary[]) =>
  stories.length > 0 ? stories[stories.length - 1].createdAt : undefined;

const storyToSummary = (story: StoryDetail): StorySummary => ({
  id: story.id,
  title: story.title,
  excerpt: story.excerpt,
  bannerImageUrl: story.bannerImageUrl,
  author: story.author,
  likeCount: story.likeCount,
  isLiked: story.isLiked ?? false,
  commentCount: story.commentCount,
  createdAt: story.createdAt,
  slug: story.slug,
  status: story.status,
});

const persistCurrent = (get: GetState, stories: StorySummary[]) => {
  persistCache({
    stories,
    nextCursor: get().nextCursor,
    hasMore: get().hasMore,
    authorId: get().activeAuthorId ?? undefined,
  });
};

/**
 * Creates story feed store actions.
 *
 * @param set - Zustand set function.
 * @param get - Zustand get function.
 * @returns Story feed actions.
 */
export const createStoryStoreActions = (set: SetState, get: GetState) => ({
  loadStories: async (authorId?: string) => {
    if (get().isLoading) return;
    set({ isLoading: true, error: null, activeAuthorId: authorId ?? null });
    const cache = restoreCache(authorId);
    const isExpired = cache ? isCacheExpired(cache.cachedAt) : true;
    if (cache) {
      const cachedStories = mergeLikedState(cache.stories);
      set({
        stories: cachedStories,
        nextCursor: cache.nextCursor,
        hasMore: cache.hasMore,
        hasLoaded: true,
        isLoading: false,
      });
    }
    try {
      const stories = await withRetry(
        () => getStoriesApi(undefined, STORIES_PAGE_SIZE, authorId),
        3,
      );
      const normalizedStories = mergeLikedState(stories);
      const hasMore = stories.length === STORIES_PAGE_SIZE;
      const nextCursor = getNextCursor(stories);
      set({
        stories: normalizedStories,
        nextCursor,
        hasMore,
        hasLoaded: true,
        error: null,
      });
      persistCache({
        stories: normalizedStories,
        nextCursor,
        hasMore,
        authorId,
      });
    } catch (error) {
      if (!cache) {
        set({
          error: getApiErrorMessage(error, "Unable to load stories."),
          hasLoaded: true,
        });
      }
    } finally {
      if (!cache || isExpired) set({ isLoading: false });
    }
  },

  loadNextPage: async () => {
    if (get().isFetchingMore || get().isLoading || !get().hasMore) return;
    set({ isFetchingMore: true, error: null });
    try {
      const authorId = get().activeAuthorId ?? undefined;
      const nextItems = await withRetry(
        () => getStoriesApi(get().nextCursor, STORIES_PAGE_SIZE, authorId),
        3,
      );
      const existingIds = new Set(get().stories.map((story) => story.id));
      const merged = mergeLikedState(
        nextItems.filter((story) => !existingIds.has(story.id)),
      );
      const stories = [...get().stories, ...merged];
      const hasMore = nextItems.length === STORIES_PAGE_SIZE;
      const nextCursor = getNextCursor(nextItems);
      set({ stories, nextCursor, hasMore, error: null });
      persistCache({ stories, nextCursor, hasMore, authorId });
    } catch (error) {
      set({
        error: getApiErrorMessage(
          error,
          "Unable to load the next batch of stories.",
        ),
      });
    } finally {
      set({ isFetchingMore: false });
    }
  },

  refreshStories: async () => {
    if (get().isRefreshing) return;
    set({ isRefreshing: true, error: null });
    try {
      const authorId = get().activeAuthorId ?? undefined;
      const stories = await withRetry(
        () => getStoriesApi(undefined, STORIES_PAGE_SIZE, authorId),
        3,
      );
      const normalizedStories = mergeLikedState(stories);
      const hasMore = stories.length === STORIES_PAGE_SIZE;
      const nextCursor = getNextCursor(stories);
      set({ stories: normalizedStories, nextCursor, hasMore, error: null });
      persistCache({
        stories: normalizedStories,
        nextCursor,
        hasMore,
        authorId,
      });
    } catch (error) {
      set({ error: getApiErrorMessage(error, "Unable to refresh stories.") });
    } finally {
      set({ isRefreshing: false });
    }
  },

  addStoryToFeed: (story: StoryDetail) => {
    const stories = [storyToSummary(story), ...get().stories];
    set({ stories });
    persistCurrent(get, stories);
  },

  updateStoryInFeed: (storyId: string, updates: Partial<StorySummary>) => {
    const stories = get().stories.map((story) =>
      story.id === storyId ? { ...story, ...updates } : story,
    );
    set({ stories });
    persistCurrent(get, stories);
  },

  removeStoryFromFeed: (storyId: string) => {
    const stories = get().stories.filter((story) => story.id !== storyId);
    set({ stories });
    persistCurrent(get, stories);
  },

  updateLikeState: (storyId: string, likeCount: number, isLiked: boolean) => {
    const stories = get().stories.map((story) =>
      story.id === storyId ? { ...story, likeCount, isLiked } : story,
    );
    const likedIds = readLikedIds();
    if (isLiked) {
      likedIds.add(storyId);
    } else {
      likedIds.delete(storyId);
    }
    persistLikedIds(likedIds);
    set({ stories });
    persistCurrent(get, stories);
  },

  updateLikeCount: (storyId: string, likeCount: number) => {
    const stories = get().stories.map((story) =>
      story.id === storyId ? { ...story, likeCount } : story,
    );
    set({ stories });
    persistCurrent(get, stories);
  },
});
