/**
 * 1. SIGN IN (Google)
 * Endpoint: POST /auth/signInWithGoogle
 */
export interface SignInWithGoogleRequest {
  /** The OpenID Connect ID Token received from Google SDK */
  idToken: string;
}

export interface SignInResponse {
  /** Long-lived token used to generate short-lived Access Tokens */
  refreshToken: string;

  /** Optional: Backend system user id (MongoDB _id). */
  userId?: string;

  /** * Indicates if the user has completed the registration wizard.
   * * true: User exists and has profile data.
   * * false: User is new and must be redirected to Registration Wizard.
   * Optional because some backend flows only return tokens/userId.
   */
  isRegistered?: boolean;

  /** Optional: Short-lived token if backend returns it immediately */
  accessToken?: string;
}

/**
 * 2. REFRESH TOKEN
 * Endpoint: POST /auth/refreshJWT
 */
export interface RefreshJWTRequest {
  refreshToken: string;
}

export interface RefreshJWTResponse {
  /** Short-lived token (usually 15m) used for authenticated requests */
  accessToken: string;
}

/**
 * 3. CREATE ACCOUNT
 * Endpoint: POST /user/createAccount
 * Note: This request requires the 'accessToken' in the Authorization header.
 */
export interface CreateAccountRequest {
  /** Combined Full Name */
  name: string;

  /** ISO Date String (e.g. "1990-01-01T00:00:00.000Z") */
  dateOfBirth: string;

  gender: string;
  city: string;

  /** Email from Google/Input */
  email: string;

  /** Verified Mobile Number */
  mobileNumber: string;

  /** Optional URL */
  website?: string | null;

  interests: string[];

  /** Note: Backend calls this 'skillsets', not 'skills' */
  skillsets: string[];
}

export interface CreateAccountResponse {
  /** Optional: Returns a refresh token if the backend rotates session credentials. */
  refreshToken?: string;

  /** Should be true after successful creation */
  isRegistered?: boolean;

  /** The unique ID of the newly created user. */
  userId: string;
}
