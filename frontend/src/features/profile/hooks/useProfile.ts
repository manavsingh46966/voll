import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  followUserApi,
  getFollowersApi,
  getFollowingApi,
  getMyProfileApi,
  getUserProfileApi,
  searchUsersApi,
  unfollowUserApi,
  updateMyProfileApi,
  updateProfilePhotoApi,
} from "../api/profile.api";
import type {
  PrivateUserProfile,
  PublicUserProfile,
  UpdateProfilePayload,
} from "../types/profile.types";

// ---------------------------------------------------------------------------
// Query Key Factory — keeps keys consistent across the feature
// ---------------------------------------------------------------------------

export const profileKeys = {
  me: ["profile", "me"] as const,
  user: (userId: string) => ["profile", "user", userId] as const,
  followers: (userId: string) => ["profile", "followers", userId] as const,
  following: (userId: string) => ["profile", "following", userId] as const,
  search: (q: string) => ["profile", "search", q] as const,
};

// ---------------------------------------------------------------------------
// GET OWN PROFILE
// ---------------------------------------------------------------------------

/**
 * Fetches and caches the authenticated user's private profile.
 */
export const useMyProfile = () => {
  return useQuery<PrivateUserProfile>({
    queryKey: profileKeys.me,
    queryFn: getMyProfileApi,
    staleTime: 1000 * 60 * 5, // 5 minutes — profile data changes infrequently
  });
};

// ---------------------------------------------------------------------------
// GET PUBLIC USER PROFILE
// ---------------------------------------------------------------------------

/**
 * Fetches and caches a public user's profile by userId.
 * @param userId
 */
export const useUserProfile = (userId: string) => {
  return useQuery<PublicUserProfile>({
    queryKey: profileKeys.user(userId),
    queryFn: () => getUserProfileApi(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 2,
  });
};

/**
 *
 * @param q
 */
export const useUserSearch = (q: string) => {
  const normalized = q.trim();

  return useInfiniteQuery({
    queryKey: profileKeys.search(normalized),
    queryFn: ({ pageParam }) =>
      searchUsersApi(normalized, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: normalized.length >= 2,
    staleTime: 1000 * 30,
  });
};

// ---------------------------------------------------------------------------
// UPDATE OWN PROFILE
// ---------------------------------------------------------------------------

/**
 * Mutation to update the authenticated user's profile.
 * On success, invalidates the 'me' query so the UI refreshes.
 */
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProfilePayload) => updateMyProfileApi(data),
    onSuccess: () => {
      // Invalidate own profile so it re-fetches fresh data
      queryClient.invalidateQueries({ queryKey: profileKeys.me });
    },
  });
};

// ---------------------------------------------------------------------------
// UPDATE PROFILE PHOTO
// ---------------------------------------------------------------------------

/**
 * Mutation to update the profile photo URL.
 * On success, optimistically updates the cached profile.
 */
export const useUpdateProfilePhoto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (profileImageUrl: string | null) =>
      updateProfilePhotoApi({ profileImageUrl }),
    onSuccess: (data) => {
      // Optimistically update the cached 'me' profile
      queryClient.setQueryData<PrivateUserProfile>(profileKeys.me, (old) =>
        old ? { ...old, profileImageUrl: data.profileImageUrl } : old,
      );
    },
  });
};

// ---------------------------------------------------------------------------
// FOLLOW USER
// ---------------------------------------------------------------------------

/**
 * Mutation to follow a user with optimistic update.
 * Instantly flips isFollowing → true and increments followersCount in cache.
 * @param targetUserId
 */
export const useFollowUser = (targetUserId: string) => {
  const queryClient = useQueryClient();
  const queryKey = profileKeys.user(targetUserId);

  return useMutation({
    mutationFn: () => followUserApi(targetUserId),
    // Optimistic update — make the UI feel instant
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<PublicUserProfile>(queryKey);

      queryClient.setQueryData<PublicUserProfile>(queryKey, (old) =>
        old
          ? {
              ...old,
              isFollowing: true,
              followersCount: old.followersCount + 1,
            }
          : old,
      );

      return { previous };
    },
    // On error, roll back to previous state
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    // Always sync with server state after mutation
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ["profile", "search"] });
    },
  });
};

// ---------------------------------------------------------------------------
// UNFOLLOW USER
// ---------------------------------------------------------------------------

/**
 * Mutation to unfollow a user with optimistic update.
 * @param targetUserId
 */
export const useUnfollowUser = (targetUserId: string) => {
  const queryClient = useQueryClient();
  const queryKey = profileKeys.user(targetUserId);

  return useMutation({
    mutationFn: () => unfollowUserApi(targetUserId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<PublicUserProfile>(queryKey);

      queryClient.setQueryData<PublicUserProfile>(queryKey, (old) =>
        old
          ? {
              ...old,
              isFollowing: false,
              followersCount: Math.max(0, old.followersCount - 1),
            }
          : old,
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ["profile", "search"] });
    },
  });
};

// ---------------------------------------------------------------------------
// FOLLOWERS LIST (Infinite)
// ---------------------------------------------------------------------------

/**
 * Infinite query for a user's paginated followers list.
 * @param userId
 * @param enabled
 */
export const useFollowers = (userId: string, enabled = false) => {
  return useInfiniteQuery({
    queryKey: profileKeys.followers(userId),
    queryFn: ({ pageParam }) =>
      getFollowersApi(userId, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!userId && enabled,
  });
};

// ---------------------------------------------------------------------------
// FOLLOWING LIST (Infinite)
// ---------------------------------------------------------------------------

/**
 * Infinite query for a user's paginated following list.
 * @param userId
 * @param enabled
 */
export const useFollowing = (userId: string, enabled = false) => {
  return useInfiniteQuery({
    queryKey: profileKeys.following(userId),
    queryFn: ({ pageParam }) =>
      getFollowingApi(userId, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!userId && enabled,
  });
};
