import axios, {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
  isAxiosError,
} from "axios";

import { Platform } from "react-native";

import { useAuthStore } from "@/src/features/auth/stores/auth.store";
import { clientStorage } from "@/src/lib/storage";

/**
 * Base URL for the API, safely trimmed and resolved for the current environment.
 */
export const getBaseUrl = (): string => {
  const envUrl = (process.env.EXPO_PUBLIC_API_URL || "").trim();
  if (Platform.OS === "web" && typeof window !== "undefined" && window.location) {
    if (
      !envUrl ||
      envUrl.includes("localhost") ||
      envUrl.includes("127.0.0.1") ||
      envUrl.startsWith("http://10.") ||
      envUrl.startsWith("http://192.168.")
    ) {
      if (
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1"
      ) {
        return `http://${window.location.hostname}:3000/api`;
      }
    }
  }
  return envUrl || "http://localhost:3000/api";
};

const BASE_URL = getBaseUrl();

/**
 * Extended config interface to support the custom retry flag.
 * strict typing > any.
 */
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

/**
 * Main API Client Instance.
 * Used for all standard application requests.
 *
 * @type {AxiosInstance}
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // Standard timeout: 30 seconds
});

/**
 * Request Interceptor.
 * Automatically attaches the Access Token from storage to every outgoing request.
 *
 * @param {InternalAxiosRequestConfig} config - The axios request configuration.
 * @returns {InternalAxiosRequestConfig} The modified configuration with Authorization header.
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const accessToken = clientStorage.getItem("access_token");

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error: unknown) => Promise.reject(error),
);

// --- Refresh Logic State ---
/** Indicates if a token refresh is currently in progress to prevent duplicate calls. */
let isRefreshing = false;

/** Queue of pending requests waiting for a new token. */
let retryQueue: ((token: string) => void)[] = [];

/**
 * Response Interceptor.
 * Global error handler that detects 401 Unauthorized responses.
 * * **Logic Flow:**
 * 1. Checks if error is 401.
 * 2. **BLOCKLIST CHECK:** If URL is a Login/Signup endpoint, REJECT immediately (don't refresh).
 * 3. Attempts to refresh Access Token.
 * 4. Retries original request.
 *
 * @param {AxiosResponse} response - The successful response object.
 * @param {AxiosError} error - The error object from the failed request.
 * @returns {Promise<AxiosResponse | void>} The response of the retried request.
 * @throws {AxiosError} Rejects the promise if:
 * - The error is from a Public Endpoint (Login/Signup).
 * - The Token Refresh fails (Network/Auth error).
 * - The error is NOT a 401 (Standard error).
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    // Strict typing instead of 'any'
    const originalRequest = error.config as ExtendedAxiosRequestConfig;

    // Detect 401 Unauthorized
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      // The "Blocklist" Logic
      // We must define endpoints that return 401 logicially (e.g. "User Not Found")
      // instead of technically ("Token Expired"). We must NOT try to refresh these.
      const isPublicEndpoint =
        originalRequest.url?.includes("/auth/signInWithGoogle") ||
        originalRequest.url?.includes("/auth/login") ||
        originalRequest.url?.includes("/auth/refreshJWT"); // Prevent infinite loops

      if (isPublicEndpoint) {
        // Pass the 401 back to the Hook so it can show the "User Not Found" modal
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      // 1. If refresh is already happening, queue this request
      if (isRefreshing) {
        return new Promise((resolve) => {
          retryQueue.push((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(originalRequest));
          });
        });
      }

      // 2. Start Refresh Process
      isRefreshing = true;

      try {
        const refreshToken = clientStorage.getItem("refresh_token");
        if (!refreshToken) {
          throw new Error("No refresh token available in storage.");
        }

        // CRITICAL: We use a raw 'axios' call here instead of importing from 'auth.api.ts'.
        // This prevents the Circular Dependency (axios -> auth.api -> axios).
        const refreshResponse = await axios.post(
          `${BASE_URL}/auth/refreshJWT`,
          { refreshToken },
          { headers: { "Content-Type": "application/json" } },
        );

        const newAccessToken = refreshResponse.data.accessToken;

        // 3. Update Store & Persistence
        // OPTIMIZATION: Removed redundant clientStorage.setItem()
        // calling store.login() automatically persists tokens via the Store logic.
        const store = useAuthStore.getState();
        if (store.user) {
          store.login({
            ...store.user,
            accessToken: newAccessToken,
            refreshToken: refreshToken, // Keep existing refresh token
          });
        } else {
          // Fallback: If store state is lost but storage had token,
          // we must manually update storage to keep the session alive.
          clientStorage.setItem("access_token", newAccessToken);
        }

        // 4. Process Queue: Retry all stalled requests with new token
        retryQueue.forEach((callback) => callback(newAccessToken));
        retryQueue = [];

        // 5. Retry the Original Failed Request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        console.error("[AUTH] Token refresh failed:", refreshError);

        // Clear Queue
        retryQueue = [];

        // Check if it's an Auth Error before killing the session
        const status = (refreshError as AxiosError).response?.status;

        if (status === 401 || status === 403) {
          // Session is truly dead (Server rejected refresh token). Logout.
          useAuthStore.getState().logout();
        } else {
          // It's a network/server error (e.g. 500 or No Internet).
          // Keep session alive so user can retry later.
          console.warn(
            "[AUTH] Refresh failed due to network/server. Session preserved.",
          );
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Return all other errors as-is
    return Promise.reject(error);
  },
);

/** Shape of the backend error envelope (`{ success: false, message, error }`). */
interface ApiErrorBody {
  message?: unknown;
  error?: unknown;
}

/**
 * Extracts a user-facing message from an unknown caught error.
 * Prefers the backend's `message`, then `error`, then the JS error message.
 *
 * @param error - The caught error (Axios or otherwise).
 * @param fallback - Message used when nothing readable is available.
 * @returns A non-empty, user-facing error message.
 */
export const getApiErrorMessage = (
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string => {
  if (isAxiosError<ApiErrorBody>(error)) {
    if (error.message === "Network Error" || !error.response) {
      return "Network Error: Unable to connect to backend server. Please make sure the backend server is running on port 3000.";
    }
    const body = error.response?.data;
    if (typeof body?.message === "string" && body.message.trim()) {
      return body.message;
    }
    if (typeof body?.error === "string" && body.error.trim()) {
      return body.error;
    }
  }
  if (error instanceof Error && error.message) {
    if (error.message.includes("auth/network-request-failed")) {
      return "Firebase Network Error: Unable to reach authentication service. Please check your internet connection.";
    }
    if (error.message.includes("auth/popup-closed-by-user")) {
      return "Google Sign-In popup was closed before completion.";
    }
    return error.message;
  }
  return fallback;
};
