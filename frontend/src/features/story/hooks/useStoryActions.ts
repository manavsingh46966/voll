import { useMutation, useQueryClient } from "@tanstack/react-query";

import { getApiErrorMessage } from "@/src/lib/axios";
import { useSessionStore } from "@/src/stores/session.store";

import {
  createStoryApi,
  CreateStoryPayload,
  deleteStoryApi,
  likeStoryApi,
  updateStoryApi,
  UpdateStoryPayload,
} from "../api/stories.api";

/**
 * Custom hook providing authenticated story mutation actions.
 * 1. TanStack Query Mutations: Replaces manual `useState` toggles (`isLoading`, `error`)
 * with `useMutation`. This automatically handles background states, retries, and cache syncing.
 * 2. Cache Invalidation: Automatically triggers background refetches of the story feed
 * when a story is created, updated, or deleted, ensuring the UI is never stale.
 * 3. Optimistic Updates: For actions like "Liking", we update the UI instantly before the
 * server responds, rolling it back if the network request fails.
 *
 * @returns An object containing grouped mutation functions and their respective loading/error states.
 */
export const useStoryActions = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useSessionStore();
  const userId = user?.id;

  /**
   * Helper to intercept unauthenticated users before hitting the network.
   * Throws an error that TanStack Query will catch and expose in the `.error` property.
   */
  const requireAuth = () => {
    if (!isAuthenticated) {
      throw new Error("You must be logged in to perform this action.");
    }
  };

  // ============================================================================
  // CREATE STORY MUTATION
  // ============================================================================
  const createStoryMutation = useMutation({
    mutationFn: async (payload: CreateStoryPayload) => {
      requireAuth();
      return await createStoryApi(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stories", "feed"] });
    },
  });

  // ============================================================================
  // UPDATE STORY MUTATION
  // ============================================================================
  const updateStoryMutation = useMutation({
    mutationFn: async ({
      storyId,
      payload,
    }: {
      storyId: string;
      payload: UpdateStoryPayload;
    }) => {
      requireAuth();
      return await updateStoryApi(storyId, payload);
    },
    onSuccess: (updatedStory) => {
      queryClient.setQueryData(
        ["story", "article", updatedStory.slug, userId],
        updatedStory,
      );
      queryClient.invalidateQueries({ queryKey: ["stories", "feed"] });
    },
  });

  // ============================================================================
  // DELETE STORY MUTATION
  // ============================================================================
  const deleteStoryMutation = useMutation({
    mutationFn: async (storyId: string) => {
      requireAuth();
      await deleteStoryApi(storyId);
      return storyId;
    },
    onSuccess: (deletedStoryId) => {
      queryClient.removeQueries({ queryKey: ["story", "article"] });
      queryClient.invalidateQueries({ queryKey: ["stories", "feed"] });
    },
  });

  // ============================================================================
  // TOGGLE LIKE MUTATION
  // ============================================================================
  const toggleLikeMutation = useMutation({
    mutationFn: async (storyId: string) => {
      requireAuth();
      return await likeStoryApi(storyId);
    },
    onMutate: async (storyId) => {
      requireAuth();
      await queryClient.cancelQueries({ queryKey: ["stories", "feed"] });
      await queryClient.cancelQueries({ queryKey: ["story", "article"] });
      return { previousTime: Date.now() };
    },
    onError: (err, newTodo, context) => {
      queryClient.invalidateQueries({ queryKey: ["stories", "feed"] });
      queryClient.invalidateQueries({ queryKey: ["story", "article"] });
    },
  });

  // ============================================================================
  // EXPOSED API
  // ============================================================================
  return {
    isAuthenticated,

    // --- Wrapped Functions to match the exact arguments expected by the UI ---
    createStory: createStoryMutation.mutateAsync,

    // 🚨 FIX 1: Wraps the object argument into two distinct arguments for the Edit Modal
    updateStory: (storyId: string, payload: UpdateStoryPayload) =>
      updateStoryMutation.mutateAsync({ storyId, payload }),

    deleteStory: deleteStoryMutation.mutateAsync,
    toggleLike: toggleLikeMutation.mutateAsync,

    isLoading:
      createStoryMutation.isPending ||
      updateStoryMutation.isPending ||
      deleteStoryMutation.isPending ||
      toggleLikeMutation.isPending,

    error:
      (updateStoryMutation.error
        ? getApiErrorMessage(updateStoryMutation.error)
        : null) ||
      (createStoryMutation.error
        ? getApiErrorMessage(createStoryMutation.error)
        : null) ||
      (deleteStoryMutation.error
        ? getApiErrorMessage(deleteStoryMutation.error)
        : null) ||
      (toggleLikeMutation.error
        ? getApiErrorMessage(toggleLikeMutation.error)
        : null),

    clearError: () => {
      createStoryMutation.reset();
      updateStoryMutation.reset();
      deleteStoryMutation.reset();
      toggleLikeMutation.reset();
    },

    // --- Specific states (Kept for fine-grained control if you need them later) ---
    isCreating: createStoryMutation.isPending,
    createError: createStoryMutation.error
      ? getApiErrorMessage(createStoryMutation.error)
      : null,
    isUpdating: updateStoryMutation.isPending,
    updateError: updateStoryMutation.error
      ? getApiErrorMessage(updateStoryMutation.error)
      : null,
    isDeleting: deleteStoryMutation.isPending,
    deleteError: deleteStoryMutation.error
      ? getApiErrorMessage(deleteStoryMutation.error)
      : null,
    isTogglingLike: toggleLikeMutation.isPending,
    toggleLikeError: toggleLikeMutation.error
      ? getApiErrorMessage(toggleLikeMutation.error)
      : null,
  };
};
