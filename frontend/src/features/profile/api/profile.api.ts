import { apiClient } from "@/src/lib/axios";

import type {
  FollowListPage,
  PrivateUserProfile,
  PublicUserProfile,
  UpdateProfilePayload,
  UpdateProfilePhotoPayload,
  UserSearchPage,
} from "../types/profile.types";

/** Standard API envelope used by our backend */
interface ApiResponse<T> {
  success: boolean;
  data: T;
}

// ---------------------------------------------------------------------------
// GET OWN PROFILE
// ---------------------------------------------------------------------------

/**
 * Fetches the authenticated user's full private profile.
 * Endpoint: GET /user/me/profile
 */
export const getMyProfileApi = async (): Promise<PrivateUserProfile> => {
  const res =
    await apiClient.get<ApiResponse<PrivateUserProfile>>("/user/me/profile");
  return res.data.data;
};

// ---------------------------------------------------------------------------
// GET PUBLIC USER PROFILE
// ---------------------------------------------------------------------------

/**
 * Fetches any user's public profile.
 * Endpoint: GET /user/:userId/profile
 * @param userId
 */
export const getUserProfileApi = async (
  userId: string,
): Promise<PublicUserProfile> => {
  const res = await apiClient.get<ApiResponse<PublicUserProfile>>(
    `/user/${userId}/profile`,
  );
  return res.data.data;
};

// ---------------------------------------------------------------------------
// UPDATE OWN PROFILE
// ---------------------------------------------------------------------------

/**
 * Partially updates the authenticated user's profile.
 * Endpoint: PUT /user/me/profile
 * @param data
 */
export const updateMyProfileApi = async (
  data: UpdateProfilePayload,
): Promise<{ updated: true }> => {
  const res = await apiClient.put<ApiResponse<{ updated: true }>>(
    "/user/me/profile",
    data,
  );
  return res.data.data;
};

// ---------------------------------------------------------------------------
// UPDATE PROFILE PHOTO
// ---------------------------------------------------------------------------

/**
 * Updates the profile photo URL.
 * No S3 — client provides the URL string directly.
 * Endpoint: PUT /user/me/profile/photo
 * @param data
 */
export const updateProfilePhotoApi = async (
  data: UpdateProfilePhotoPayload,
): Promise<{ profileImageUrl: string | null }> => {
  const res = await apiClient.put<
    ApiResponse<{ profileImageUrl: string | null }>
  >("/user/me/profile/photo", data);
  return res.data.data;
};

// ---------------------------------------------------------------------------
// SEARCH PEOPLE
// ---------------------------------------------------------------------------

/**
 *
 * @param q
 * @param cursor
 */
export const searchUsersApi = async (
  q: string,
  cursor?: string,
): Promise<UserSearchPage> => {
  const params = cursor ? { q, cursor } : { q };
  const res = await apiClient.get<
    ApiResponse<{ users: UserSearchPage["users"]; nextCursor: string | null }>
  >("/user/search", { params });
  return res.data.data;
};

// ---------------------------------------------------------------------------
// FOLLOW / UNFOLLOW
// ---------------------------------------------------------------------------

/**
 * Follow a user.
 * Endpoint: POST /user/:userId/follow
 * @param userId
 * @param data
 * @param data.platform
 * @param data.source
 */
export const followUserApi = async (
  userId: string,
  data?: { platform?: "ios" | "android" | "web"; source?: string },
): Promise<{ followersCount: number }> => {
  const res = await apiClient.post<ApiResponse<{ followersCount: number }>>(
    `/user/${userId}/follow`,
    data,
  );
  return res.data.data;
};

/**
 * Unfollow a user.
 * Endpoint: DELETE /user/:userId/follow
 * @param userId
 * @param data
 * @param data.platform
 */
export const unfollowUserApi = async (
  userId: string,
  data?: { platform?: "ios" | "android" | "web" },
): Promise<{ followersCount: number }> => {
  const res = await apiClient.delete<ApiResponse<{ followersCount: number }>>(
    `/user/${userId}/follow`,
    { data },
  );
  return res.data.data;
};

// ---------------------------------------------------------------------------
// FOLLOW LISTS (Paginated)
// ---------------------------------------------------------------------------

/**
 * Fetches a paginated list of a user's followers.
 * Endpoint: GET /user/:userId/followers
 * @param userId
 * @param cursor
 */
export const getFollowersApi = async (
  userId: string,
  cursor?: string,
): Promise<FollowListPage> => {
  const params = cursor ? { cursor } : {};
  const res = await apiClient.get<
    ApiResponse<{ users: FollowListPage["users"]; nextCursor: string | null }>
  >(`/user/${userId}/followers`, { params });
  return {
    users: res.data.data.users,
    nextCursor: res.data.data.nextCursor,
  };
};

/**
 * Fetches a paginated list of users a given user follows.
 * Endpoint: GET /user/:userId/following
 * @param userId
 * @param cursor
 */
export const getFollowingApi = async (
  userId: string,
  cursor?: string,
): Promise<FollowListPage> => {
  const params = cursor ? { cursor } : {};
  const res = await apiClient.get<
    ApiResponse<{ users: FollowListPage["users"]; nextCursor: string | null }>
  >(`/user/${userId}/following`, { params });
  return {
    users: res.data.data.users,
    nextCursor: res.data.data.nextCursor,
  };
};
