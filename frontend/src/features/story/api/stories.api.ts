import { apiClient } from "@/src/lib/axios";

import { StoryDetail, StorySummary } from "../types/story.types";
import {
  ApiStory,
  normalizeStoryDetail,
  normalizeStorySummary,
} from "../utils/storyUtils";

/**
 * Standard API Response Wrapper.
 * Mirrors the backend's `Result` type envelope: { success: true, data: T }
 * This prevents runtime crashes by letting TypeScript know exactly how to unwrap responses.
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

const STORIES_PATH = "/stories";

/**
 * Fetches a paginated list of story summaries.
 * * Uses Cursor-based pagination for high performance and to prevent duplicates
 * when items are added to the database during scrolling.
 *
 * @param {string} [cursor] - The `createdAt` timestamp of the last loaded story (optional).
 * @param {number} [limit=10] - How many stories to fetch in this batch (defaults to 10).
 * @param {string} [authorId] - If provided, filters stories by a specific author. If "me", fetches the authenticated user's stories.
 * @returns {Promise<StorySummary[]>} A promise resolving to an array of normalized StorySummary objects for the UI.
 */
export const getStoriesApi = async (
  cursor?: string,
  limit = 10,
  authorId?: string,
): Promise<StorySummary[]> => {
  const params: Record<string, string | number> = { limit };

  // Safely check cursor to ensure we don't send stringified null/undefined to the backend
  if (cursor && cursor !== "undefined" && cursor !== "null") {
    params.cursor = cursor;
  }

  if (authorId) {
    params.authorId = authorId === "me" ? "me" : authorId;
  }

  // Unwrap the Axios response (.data) and the Backend envelope (.data)
  const response = await apiClient.get<ApiResponse<ApiStory[]>>(STORIES_PATH, {
    params,
  });

  // Extract the actual array from the backend's 'data' property
  const rawStories = response.data.data;
  return rawStories.map((story) => normalizeStorySummary(story));
};

/**
 * Fetches the full details of a specific story by its unique MongoDB ID.
 *
 * @param {string} storyId - The MongoDB ObjectId of the story.
 * @returns {Promise<StoryDetail>} A promise resolving to a normalized StoryDetail object.
 */
export const getStoryByIdApi = async (
  storyId: string,
): Promise<StoryDetail> => {
  const response = await apiClient.get<ApiResponse<ApiStory>>(
    `${STORIES_PATH}/${storyId}`,
  );

  return normalizeStoryDetail(response.data.data);
};

export interface CreateStoryPayload {
  title: string;
  bodyMarkdown: string;
  bannerImageUrl?: string;
  bannerImageData?: string;
  bannerImageMimeType?: string;
  eventTimeframe?: string;
}

export interface UpdateStoryPayload {
  title?: string;
  bodyMarkdown?: string;
  bannerImageUrl?: string;
  bannerImageData?: string;
  bannerImageMimeType?: string;
  eventTimeframe?: string;
  status?: "draft" | "pending_approval" | "published" | "archived";
}

/**
 * Creates a new story.
 * * Sends raw markdown to the backend. The backend is responsible for sanitizing
 * the markdown to prevent Stored XSS attacks.
 *
 * @param {CreateStoryPayload} payload - Story creation payload including title and markdown content.
 * @returns {Promise<StoryDetail>} A promise resolving to the created story's details.
 */
export const createStoryApi = async (
  payload: CreateStoryPayload,
): Promise<StoryDetail> => {
  const response = await apiClient.post<ApiResponse<ApiStory>>(
    STORIES_PATH,
    payload,
  );

  return normalizeStoryDetail(response.data.data);
};

/**
 * Updates an existing story.
 * * Uses a PUT request (or PATCH, depending on your router) to update fields.
 * Only the fields provided in the payload will be modified.
 *
 * @param {string} storyId - The ID of the story to update.
 * @param {UpdateStoryPayload} payload - The fields to update.
 * @returns {Promise<StoryDetail>} A promise resolving to the freshly updated story details.
 */
export const updateStoryApi = async (
  storyId: string,
  payload: UpdateStoryPayload,
): Promise<StoryDetail> => {
  const response = await apiClient.put<ApiResponse<ApiStory>>(
    `${STORIES_PATH}/${storyId}`,
    payload,
  );

  return normalizeStoryDetail(response.data.data);
};

/**
 * Soft-deletes a story.
 * * The backend changes `isDeleted: true` rather than wiping the database record,
 * allowing for data recovery if a user accidentally deletes their post.
 *
 * @param {string} storyId - The ID of the story to delete.
 * @returns {Promise<void>} A promise that resolves when the deletion is confirmed.
 */
export const deleteStoryApi = async (storyId: string): Promise<void> => {
  await apiClient.delete<ApiResponse<void>>(`${STORIES_PATH}/${storyId}`);
};

/**
 * Toggles a like on a story for the authenticated user.
 * * Returns the entire updated story object so the UI can refresh the like count
 * and the `isLiked` boolean state.
 *
 * @param {string} storyId - The ID of the story to like or unlike.
 * @returns {Promise<StoryDetail>} A promise resolving to the updated story detail.
 */
export const likeStoryApi = async (storyId: string): Promise<StoryDetail> => {
  const response = await apiClient.post<ApiResponse<ApiStory>>(
    `${STORIES_PATH}/${storyId}/like`,
  );

  return normalizeStoryDetail(response.data.data);
};

/**
 * Fetches a story using its SEO-friendly URL slug instead of its ID.
 * * Crucial for Next.js/React Router dynamic routes (e.g., /story/my-first-post).
 *
 * @param {string} slug - The URL-friendly slug of the story.
 * @returns {Promise<StoryDetail>} A promise resolving to a normalized StoryDetail object.
 */
export const getStoryBySlugApi = async (slug: string): Promise<StoryDetail> => {
  const response = await apiClient.get<ApiResponse<ApiStory>>(
    `${STORIES_PATH}/article/${slug}`,
  );

  return normalizeStoryDetail(response.data.data);
};

/**
 * Records a unique view for a story.
 * * The backend deduplicates views based on User ID to prevent view-count padding.
 * Fire this API call when the story component fully mounts and becomes visible.
 *
 * @param {string} storyId - The ID of the story being viewed.
 * @returns {Promise<void>} A promise that resolves when the view is recorded.
 */
export const recordStoryViewApi = async (storyId: string): Promise<void> => {
  await apiClient.post<ApiResponse<void>>(
    `${STORIES_PATH}/${storyId}/record-view`,
  );
};

/**
 * Records a "read" for a story.
 * * A "read" is a higher-value metric than a "view". You should only fire this API
 * call if the user scrolls to the bottom of the article or spends X seconds on the page.
 *
 * @param {string} storyId - The ID of the story being read.
 * @returns {Promise<void>} A promise that resolves when the read is recorded.
 */
export const recordStoryReadApi = async (storyId: string): Promise<void> => {
  await apiClient.post<ApiResponse<void>>(
    `${STORIES_PATH}/${storyId}/record-read`,
  );
};
