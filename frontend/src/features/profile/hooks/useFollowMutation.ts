import { Platform } from "react-native";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { followUserApi, unfollowUserApi } from "../api/profile.api";
import type { PublicUserProfile } from "../types/profile.types";

import { profileKeys } from "./useProfile";

interface UseFollowMutationOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

interface FollowMutationContext {
  previousProfile?: PublicUserProfile;
}

const getPlatform = (): "ios" | "android" | "web" =>
  Platform.OS === "ios" ? "ios" : Platform.OS === "android" ? "android" : "web";

const invalidateRelationshipCaches = (
  queryClient: ReturnType<typeof useQueryClient>,
) => {
  queryClient.invalidateQueries({ queryKey: ["profile"] });
  queryClient.invalidateQueries({ queryKey: ["stories"] });
};

/**
 * Hook for following a user with optimistic updates
 *
 * @param options - Optional mutation lifecycle callbacks.
 * @returns Follow user mutation.
 */
export const useFollowUser = (options?: UseFollowMutationOptions) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      return await followUserApi(userId, {
        platform: getPlatform(),
        source: "profile_visit",
      });
    },
    onMutate: async (userId: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: profileKeys.user(userId),
      });

      // Snapshot the previous value
      const previousProfile = queryClient.getQueryData<PublicUserProfile>(
        profileKeys.user(userId),
      );

      // Optimistically update
      queryClient.setQueryData<PublicUserProfile>(
        profileKeys.user(userId),
        (old) =>
          old
            ? {
                ...old,
                isFollowing: true,
                followersCount: old.followersCount + 1,
              }
            : old,
      );

      return { previousProfile };
    },
    onError: (error, userId, context?: FollowMutationContext) => {
      // Revert on error
      if (context?.previousProfile) {
        queryClient.setQueryData(
          profileKeys.user(userId),
          context.previousProfile,
        );
      }
      options?.onError?.(error);
    },
    onSuccess: (data, userId) => {
      // Update profile cache with new followers count
      queryClient.setQueryData<PublicUserProfile>(
        profileKeys.user(userId),
        (old) =>
          old
            ? {
                ...old,
                followersCount: data.followersCount ?? old.followersCount,
                isFollowing: true,
              }
            : old,
      );
      invalidateRelationshipCaches(queryClient);
      options?.onSuccess?.();
    },
    onSettled: () => {
      invalidateRelationshipCaches(queryClient);
    },
  });
};

/**
 * Hook for unfollowing a user with optimistic updates
 *
 * @param options - Optional mutation lifecycle callbacks.
 * @returns Unfollow user mutation.
 */
export const useUnfollowUser = (options?: UseFollowMutationOptions) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      return await unfollowUserApi(userId, {
        platform: getPlatform(),
      });
    },
    onMutate: async (userId: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: profileKeys.user(userId),
      });

      // Snapshot the previous value
      const previousProfile = queryClient.getQueryData<PublicUserProfile>(
        profileKeys.user(userId),
      );

      // Optimistically update
      queryClient.setQueryData<PublicUserProfile>(
        profileKeys.user(userId),
        (old) =>
          old
            ? {
                ...old,
                isFollowing: false,
                followersCount: Math.max(old.followersCount - 1, 0),
              }
            : old,
      );

      return { previousProfile };
    },
    onError: (error, userId, context?: FollowMutationContext) => {
      // Revert on error
      if (context?.previousProfile) {
        queryClient.setQueryData(
          profileKeys.user(userId),
          context.previousProfile,
        );
      }
      options?.onError?.(error);
    },
    onSuccess: (data, userId) => {
      // Update profile cache with new followers count
      queryClient.setQueryData<PublicUserProfile>(
        profileKeys.user(userId),
        (old) =>
          old
            ? {
                ...old,
                followersCount:
                  data.followersCount ?? Math.max(old.followersCount - 1, 0),
                isFollowing: false,
              }
            : old,
      );
      invalidateRelationshipCaches(queryClient);
      options?.onSuccess?.();
    },
    onSettled: () => {
      invalidateRelationshipCaches(queryClient);
    },
  });
};
