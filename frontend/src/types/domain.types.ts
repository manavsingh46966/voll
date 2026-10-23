/**
 * DOMAIN MODELS
 * Entities that represent core business objects within the Authentication feature.
 * These models are used internally by the UI and State Management layers.
 */

/**
 * Standardized Google User Profile.
 * Returned by both Native and Web Google Providers after a successful OAuth handshake.
 * Used to normalize the platform-specific response into a common shape.
 */
export interface GoogleUserResult {
  /** The unique Firebase User ID (UID). */
  uid: string;

  /** The user's primary email address associated with their Google account. */
  email: string;

  /** The full display name (First + Last) returned by Google. */
  displayName: string;

  /** The public URL to the user's Google profile picture. */
  photoURL: string;
}

/**
 * The Primary User Entity.
 * Represents the fully authenticated user within the global application state.
 * This object is hydrated from storage on app launch and updated after login/registration.
 */
export interface User {
  /** The unique System ID (Database Primary Key), distinct from Firebase UID. */
  id: string;

  /** The user's full legal name. */
  name: string;

  /** The unique email address used for login. */
  email: string;
  role?: "superadmin" | "user";
  accountStatus?: "active" | "suspended" | "deleted";
  permissions?: string[];

  /** * Short-lived JSON Web Token (JWT) used for authorizing API requests.
   * usually expires in 15-60 minutes.
   */
  accessToken: string;

  /** * Long-lived token used to negotiate new Access Tokens.
   * Kept securely in storage to maintain the session.
   */
  refreshToken: string;

  // --- Optional Profile Fields ---

  /** The user's verified mobile number (E.164 format). */
  mobileNumber?: string;

  /** URL to the user's profile avatar. Null if not set. */
  profileImageUrl?: string | null;

  /** The user's city of residence. */
  city?: string;

  /** The user's gender identity (e.g., 'Male', 'Female', 'Other'). */
  gender?: string;

  /** Date of Birth in ISO 8601 format (YYYY-MM-DD). */
  dob?: string;
}
