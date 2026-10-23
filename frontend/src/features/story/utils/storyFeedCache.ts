import { clientStorage } from "@/src/lib/storage";

import { StorySummary } from "../types/story.types";

const STORIES_CACHE_KEY = "story_feed_cache_v2";
const STORY_LIKED_IDS_KEY = "story_liked_ids_v1";
const STORIES_CACHE_TTL_MS = 1000 * 60 * 15;

export const STORIES_PAGE_SIZE = 10;

export interface CachedStoryState {
  stories: StorySummary[];
  nextCursor?: string;
  hasMore: boolean;
  cachedAt: number;
  authorId?: string;
}

const getStoriesCacheKey = (authorId?: string) =>
  authorId ? `${STORIES_CACHE_KEY}:${authorId}` : STORIES_CACHE_KEY;

const getNextCursor = (stories: StorySummary[]) =>
  stories.length > 0 ? stories[stories.length - 1].createdAt : undefined;

/**
 * Persists a small story feed snapshot to local storage.
 *
 * @param cachedState - Story feed snapshot to persist.
 */
export const persistCache = (
  cachedState: Omit<CachedStoryState, "cachedAt">,
) => {
  const limitedStories = cachedState.stories.slice(0, 20);
  clientStorage.setItem(
    getStoriesCacheKey(cachedState.authorId),
    JSON.stringify({
      ...cachedState,
      stories: limitedStories,
      nextCursor: getNextCursor(limitedStories),
      cachedAt: Date.now(),
    }),
  );
};

/**
 * Restores a cached story feed snapshot.
 *
 * @param authorId - Optional author cache partition.
 * @returns Cached story feed state when valid.
 */
export const restoreCache = (authorId?: string): CachedStoryState | null => {
  const raw = clientStorage.getItem(getStoriesCacheKey(authorId));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as CachedStoryState;
    if (
      !Array.isArray(parsed.stories) ||
      typeof parsed.hasMore !== "boolean" ||
      typeof parsed.cachedAt !== "number"
    ) {
      clientStorage.removeItem(getStoriesCacheKey(authorId));
      return null;
    }
    return parsed;
  } catch {
    clientStorage.removeItem(getStoriesCacheKey(authorId));
    return null;
  }
};

/**
 * Determines whether a restored feed cache is stale.
 *
 * @param cachedAt - Cache timestamp.
 * @returns Whether the cache is expired.
 */
export const isCacheExpired = (cachedAt: number): boolean =>
  Date.now() - cachedAt > STORIES_CACHE_TTL_MS;

/**
 * Merges locally persisted like state into API stories.
 *
 * @param stories - Stories from the API or cache.
 * @returns Stories with local liked state applied.
 */
export const mergeLikedState = (stories: StorySummary[]) => {
  const raw = clientStorage.getItem(STORY_LIKED_IDS_KEY);
  if (!raw) return stories;
  try {
    const parsed = JSON.parse(raw) as string[];
    const likedIds = new Set(parsed.filter((item) => typeof item === "string"));
    return stories.map((story) =>
      likedIds.has(story.id) ? { ...story, isLiked: true } : story,
    );
  } catch {
    return stories;
  }
};

/**
 * Persists local story liked ids.
 *
 * @param likedIds - Liked story ids.
 */
export const persistLikedIds = (likedIds: Set<string>) => {
  clientStorage.setItem(STORY_LIKED_IDS_KEY, JSON.stringify([...likedIds]));
};

/**
 * Reads locally persisted story liked ids.
 *
 * @returns Liked story ids.
 */
export const readLikedIds = (): Set<string> => {
  const raw = clientStorage.getItem(STORY_LIKED_IDS_KEY);
  if (!raw) return new Set();
  try {
    const parsed = JSON.parse(raw) as string[];
    return new Set(parsed.filter((item) => typeof item === "string"));
  } catch {
    return new Set();
  }
};
