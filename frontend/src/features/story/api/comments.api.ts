import { apiClient } from "@/src/lib/axios";

import { CreateCommentPayload, StoryComment } from "../types/comment.types";
import { CommentPage } from "../utils/commentQueryUtils"; // 🚨 ADDED IMPORT

/**
 * Standard API Response Wrapper.
 * * In our architecture, the backend NEVER returns raw arrays or objects directly.
 * Every successful backend response is wrapped in an envelope that looks like:
 * { success: true, data: [...] }
 * * We define this generic interface so TypeScript knows exactly how to unwrap it.
 * (Note: You should eventually move this to a global `@/src/types/api.types.ts` file).
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

/**
 * Fetches the top-level (parent) comments for a specific story.
 * * NOTE ON PAGINATION: We use "Cursor-Based Pagination" instead of "Page Numbers" (Offset).
 * If new comments are added while the user is scrolling, page numbers would cause items
 * to shift and duplicate. Cursors (timestamps or IDs) guarantee we pick up exactly where we left off.
 *
 * @param storyId - The unique MongoDB ObjectId of the story.
 * @param cursor - The `createdAt` timestamp of the last comment currently visible on the screen.
 * The backend uses this to fetch older comments that come *after* this timestamp.
 * @param signal - An AbortSignal from the browser. If the user navigates away from the page
 * before the request finishes, this signal tells Axios to cancel the network
 * request to save bandwidth and prevent memory leaks.
 * * @returns A promise that resolves to an array of StoryComment objects.
 */
export const getCommentsApi = async (
  storyId: string,
  cursor?: string,
  signal?: AbortSignal,
): Promise<CommentPage> => {
  // 🚨 UPDATED RETURN TYPE
  const params = cursor ? { cursor } : {};

  // Notice the double <ApiResponse<StoryComment[]>> mapping.
  // Axios creates `response.data`, and our backend creates `.data` inside that.
  const response = await apiClient.get<ApiResponse<StoryComment[]>>(
    `/stories/${storyId}/comments`,
    { params, signal },
  );

  const comments = response.data.data;

  // 🚨 Auto-calculate the next cursor from the last comment's timestamp
  const nextCursor =
    comments.length > 0 ? comments[comments.length - 1].createdAt : undefined;

  // 🚨 Wrap it in the exact shape useComments & commentQueryUtils expect
  return {
    data: comments,
    nextCursor,
  };
};

/**
 * Fetches the nested replies for a specific parent comment.
 * * To keep the database fast, we do not load all replies when we load the parent comments.
 * Instead, we fetch replies "on-demand" when the user clicks "View Replies".
 *
 * @param commentId - The unique MongoDB ObjectId of the parent comment.
 * @param cursor - The timestamp of the last loaded reply (for pagination).
 * @param signal - AbortSignal to cancel the request if the component unmounts.
 * * @returns A promise that resolves to an array of reply StoryComment objects.
 */
export const getRepliesApi = async (
  commentId: string,
  cursor?: string,
  signal?: AbortSignal,
): Promise<CommentPage> => {
  // 🚨 UPDATED RETURN TYPE
  const params = cursor ? { cursor } : {};

  const response = await apiClient.get<ApiResponse<StoryComment[]>>(
    `/comments/${commentId}/replies`,
    { params, signal },
  );

  const replies = response.data.data;

  // 🚨 Auto-calculate the next cursor
  const nextCursor =
    replies.length > 0 ? replies[replies.length - 1].createdAt : undefined;

  // 🚨 Wrap it in the expected shape
  return {
    data: replies,
    nextCursor,
  };
};

/**
 * Creates a brand new comment OR a reply.
 * * If the `payload` contains a `parentId`, the backend automatically knows
 * this is a reply to an existing comment. If `parentId` is omitted or null,
 * it becomes a top-level comment on the story itself.
 *
 * @param storyId - The ID of the story this comment belongs to.
 * @param payload - The data required to create a comment (must include `content`).
 * * @returns A promise resolving to the newly created comment (which includes its generated ID,
 * author info, and creation timestamp).
 */
export const createCommentApi = async (
  storyId: string,
  payload: CreateCommentPayload,
): Promise<StoryComment> => {
  const response = await apiClient.post<ApiResponse<StoryComment>>(
    `/stories/${storyId}/comments`,
    payload,
  );

  return response.data.data;
};

/**
 * Toggles the "Like" status of a comment for the currently authenticated user.
 * * If the user has already liked the comment, the backend will remove the like.
 * If the user hasn't liked it, the backend will add a like.
 * * @param commentId - The ID of the comment being liked/unliked.
 * * @returns A promise returning the new total like count and whether the user currently likes it.
 * We return this so the UI can update instantly without needing to refetch all comments.
 * @param commentId
 */
export const likeCommentApi = async (
  commentId: string,
): Promise<{ likeCount: number; isLiked: boolean }> => {
  const response = await apiClient.post<
    ApiResponse<{ likeCount: number; isLiked: boolean }>
  >(`/comments/${commentId}/like`);

  return response.data.data;
};
