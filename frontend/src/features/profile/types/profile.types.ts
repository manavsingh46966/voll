/**
 * PROFILE DOMAIN TYPES
 * Represents the data shapes returned by the backend profile API.
 */

/** Minimal user shape used in follower/following lists */
export interface FollowUser {
  id: string;
  name: string | null;
  profileImageUrl: string | null;
  bio: string;
  isFollowing?: boolean;
  followsYou?: boolean;
  isOwner?: boolean;
}

export interface UserSearchCard {
  id: string;
  name: string | null;
  city: string | null;
  bio: string;
  profileImageUrl: string | null;
  followersCount: number;
  isFollowing: boolean;
  followsYou: boolean;
}

/**
 * Public profile — data visible to any viewer.
 * Privacy-sensitive fields are null when toggled off by the user.
 */
export interface PublicUserProfile {
  id: string;
  name: string | null;
  gender: string | null;
  city: string | null;
  bio: string;
  profileImageUrl: string | null;
  // Conditionally null based on privacy toggles
  website: string | null;
  phoneNumber: string | null;
  email: string | null;
  interests: string[];
  skillsets: string[];
  // Privacy toggle states (so the owner's UI can render switches correctly)
  showMobileNumber: boolean;
  showEmail: boolean;
  showWebsite: boolean;
  // Stats
  followersCount: number;
  followingCount: number;
  // Viewer-context fields
  isFollowing: boolean;
  isOwner: boolean;
}

/**
 * Private profile — returned only for the authenticated user's own profile.
 * Always includes all sensitive data regardless of privacy toggles.
 */
export interface PrivateUserProfile {
  id: string;
  name: string | null;
  email: string;
  phoneNumber: string | null;
  gender: string | null;
  city: string | null;
  bio: string;
  profileImageUrl: string | null;
  website: string | null;
  interests: string[];
  skillsets: string[];
  showMobileNumber: boolean;
  showEmail: boolean;
  showWebsite: boolean;
  followersCount: number;
  followingCount: number;
  role?: string;
  accountStatus?: string;
}

/** Payload for updating own profile (all fields optional) */
export interface UpdateProfilePayload {
  name?: string;
  gender?: "Male" | "Female" | "Other" | null;
  bio?: string;
  city?: string | null;
  website?: string | null;
  skillsets?: string[];
  interests?: string[];
  showMobileNumber?: boolean;
  showEmail?: boolean;
  showWebsite?: boolean;
}

/** Payload for updating profile photo */
export interface UpdateProfilePhotoPayload {
  profileImageUrl: string | null;
}

/** Paginated follow list response from the API */
export interface FollowListPage {
  users: FollowUser[];
  nextCursor: string | null;
}

export interface UserSearchPage {
  users: UserSearchCard[];
  nextCursor: string | null;
}
