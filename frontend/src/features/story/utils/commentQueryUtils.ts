import { produce } from "immer";

import { StoryComment } from "../types/comment.types";

/**
 * Represents a single paginated chunk of comments returned by our API.
 * This aligns with the new ApiResponse envelope where the array lives inside `.data`,
 * and includes the cursor for the next page.
 */
export interface CommentPage {
  data: StoryComment[];
  nextCursor?: string | null;
}

/**
 * Represents the entire React Query Infinite Query cache structure.
 * React Query stores infinite queries as an array of `pages` and an array of `pageParams`.
 */
export interface InfiniteCommentData {
  pages: CommentPage[];
  pageParams: unknown[];
}

/**
 * Generates an initial empty state containing a single comment.
 * Used when a user posts a comment before the initial fetch has completed.
 * @param comment
 */
const emptyCommentPages = (comment: StoryComment): InfiniteCommentData => ({
  pages: [{ data: [comment], nextCursor: null }],
  pageParams: [undefined],
});

/**
 * Optimistically adds a newly created comment to the very top of the feed.
 * We use `immer` (produce) to mutate a draft of the state without breaking immutability rules.
 * * @param oldData - The existing React Query cache state.
 * @param oldData
 * @param comment - The newly created comment object from the API response.
 * @returns The new cache state with the comment prepended.
 */
export const prependCommentToPages = (
  oldData: InfiniteCommentData | undefined,
  comment: StoryComment,
): InfiniteCommentData => {
  if (!oldData || oldData.pages.length === 0) {
    return emptyCommentPages(comment);
  }

  // immer's `produce` allows us to push/unshift directly on a draft object
  // without needing to map over every single item in the array.
  return produce(oldData, (draft) => {
    // Safety check in case the first page is somehow malformed
    if (!draft.pages[0].data) {
      draft.pages[0].data = [];
    }
    // Unshift adds the new comment to the start of the first page's data array
    draft.pages[0].data.unshift(comment);
  });
};

/**
 * Optimistically increments the reply count of a parent comment when a user replies to it.
 * This prevents the need to refetch all comments just to update a single number.
 * * @param oldData - The existing React Query cache state.
 * @param oldData
 * @param parentId - The unique ID of the parent comment being replied to.
 * @returns The updated cache state.
 */
export const incrementReplyCount = (
  oldData: InfiniteCommentData | undefined,
  parentId: string,
): InfiniteCommentData | undefined => {
  if (!oldData) return oldData;

  return produce(oldData, (draft) => {
    // Nested loop to find the exact comment.
    // Because we break out of the loop as soon as we find it, this is heavily optimized
    // compared to `.map()` which traverses every single item unconditionally.
    for (const page of draft.pages) {
      if (!page.data) continue;

      const comment = page.data.find((c) => c._id === parentId);
      if (comment) {
        comment.replyCount += 1;
        break; // Exit early once found for performance
      }
    }
  });
};

/**
 * Optimistically toggles the "Like" state of a specific comment.
 * It flips the boolean `isLiked` and adjusts the `likeCount` up or down accordingly.
 * * @param oldData - The existing React Query cache state.
 * @param oldData
 * @param commentId - The unique ID of the comment being liked/unliked.
 * @returns The updated cache state.
 */
export const toggleCachedCommentLike = (
  oldData: InfiniteCommentData | undefined,
  commentId: string,
): InfiniteCommentData | undefined => {
  if (!oldData) return oldData;

  return produce(oldData, (draft) => {
    for (const page of draft.pages) {
      if (!page.data) continue;

      const comment = page.data.find((c) => c._id === commentId);
      if (comment) {
        // Toggle the boolean state
        comment.isLiked = !comment.isLiked;
        // Adjust the total count based on the new boolean state
        comment.likeCount += comment.isLiked ? 1 : -1;
        break; // Exit early once found for performance
      }
    }
  });
};
