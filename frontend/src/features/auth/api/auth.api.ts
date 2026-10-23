import {
  CreateAccountRequest,
  CreateAccountResponse,
  RefreshJWTRequest,
  RefreshJWTResponse,
  SignInResponse,
  SignInWithGoogleRequest,
} from "@/src/features/auth/types/index";
import { apiClient } from "@/src/lib/axios";

/**
 * Exchange Google ID Token for a Backend Refresh Token.
 * * @endpoint POST /auth/signInWithGoogle
 * @param {SignInWithGoogleRequest} data - The payload containing { idToken: string }.
 * @returns {Promise<SignInResponse>} The Backend Tokens (Refresh Token & Access Token).
 * @throws {AxiosError} Throws if the Google Token is invalid or backend validation fails.
 */
export const signInWithGoogleApi = async (
  data: SignInWithGoogleRequest,
): Promise<SignInResponse> => {
  const response = await apiClient.post<SignInResponse>(
    "/auth/signInWithGoogle",
    data,
  );
  return response.data;
};

/**
 * Manually request a new Access Token.
 * * Note: This is primarily used by the axios interceptor internally (via raw call)
 * but exposed here if manual refresh is ever required by UI logic.
 * * @endpoint POST /auth/refreshJWT
 * @param {RefreshJWTRequest} data - The payload containing the Refresh Token.
 * @returns {Promise<RefreshJWTResponse>} A new Access Token.
 * @throws {AxiosError} Throws if the Refresh Token is expired or invalid.
 */
export const refreshJWTApi = async (
  data: RefreshJWTRequest,
): Promise<RefreshJWTResponse> => {
  const response = await apiClient.post<RefreshJWTResponse>(
    "/auth/refreshJWT",
    data,
  );
  return response.data;
};

/**
 * Create or Update the User Profile.
 * This endpoint is protected and requires a valid Access Token.
 * * @endpoint POST /user/createAccount
 * @param {CreateAccountRequest} data - The user profile details (name, dob, etc.).
 * @returns {Promise<CreateAccountResponse>} The server response (usually success status).
 * @throws {AxiosError} Throws 401 if unauthorized or 400 if validation fails.
 */
export const createAccountApi = async (
  data: CreateAccountRequest,
): Promise<CreateAccountResponse> => {
  // The 'accessToken' is automatically attached by the Request Interceptor in 'src/lib/axios.ts'.
  // We do not need to manually retrieve or pass headers here.
  const response = await apiClient.post<CreateAccountResponse>(
    "/user/createAccount",
    data,
  );
  return response.data;
};
