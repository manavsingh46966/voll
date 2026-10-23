import { create } from "zustand";

import { clientStorage } from "@/src/lib/storage";
import { User } from "@/src/types/domain.types"; // Update this path to where your global types live

/**
 * Global Session Interface.
 * Defines the contract for the application-wide authentication state.
 * This is strictly limited to identifying *who* the user is and *if* they have access.
 */
export interface SessionState {
  /** * The authenticated user object.
   * Null indicates the user is an unauthenticated "Guest".
   * Automatically hydrated from MMKV storage on app launch.
   */
  user: User | null;

  /** * Quick boolean check for restricted routes and UI elements.
   * True if 'user' is present and tokens are assumed valid.
   */
  isAuthenticated: boolean;

  /**
   * Persists the user session and updates the global state.
   * * Side Effect: Saves 'access_token', 'refresh_token', and 'user_data' to MMKV.
   * * Side Effect: Clears any lingering onboarding drafts to prevent data leaks.
   * * @param {User} user - The normalized user object received from the API layer.
   */
  login: (user: User) => void;

  /**
   * Clears all session data, effectively logging the user out.
   * * Side Effect: Removes tokens and user data from MMKV.
   * * Side Effect: Wipes onboarding drafts.
   */
  logout: () => void;

  /**
   * Restores the user session from MMKV storage on app launch.
   * Checks for existing tokens and re-populates the 'user' object seamlessly.
   * If parsing fails or data is corrupted, it safely falls back to a logged-out state.
   */
  hydrate: () => void;
}

/**
 * Global Session Store (Zustand).
 * Manages the top-level authentication state required by the entire application
 * (e.g., Router, Story Feed, Group Management).
 * * * Architectural Note: This store intentionally omits temporary registration
 * forms to prevent global state bloat.
 */
export const useSessionStore = create<SessionState>((set) => ({
  user: null,
  isAuthenticated: false,

  login: (user) => {
    // 1. Persist to Native Storage
    clientStorage.setItem("access_token", user.accessToken);
    clientStorage.setItem("refresh_token", user.refreshToken);
    clientStorage.setItem("user_data", JSON.stringify(user));

    // 2. Clear Draft Data (Security measure to prevent wizard data leaks)
    clientStorage.removeItem("signup_data");
    clientStorage.removeItem("registration_data");

    // 3. Update React State
    set({ user, isAuthenticated: true });
  },

  logout: () => {
    // 1. Clear Native Storage
    clientStorage.removeItem("access_token");
    clientStorage.removeItem("refresh_token");
    clientStorage.removeItem("user_data");
    clientStorage.removeItem("signup_data");
    clientStorage.removeItem("registration_data");

    // 2. Reset React State
    set({
      user: null,
      isAuthenticated: false,
    });
  },

  hydrate: () => {
    try {
      const accessToken = clientStorage.getItem("access_token");
      const refreshToken = clientStorage.getItem("refresh_token");
      const userData = clientStorage.getItem("user_data");

      if (refreshToken && userData) {
        const parsedUser = JSON.parse(userData) as User;

        // Ensure we use the latest token from storage if it was refreshed
        parsedUser.accessToken = accessToken || parsedUser.accessToken;
        parsedUser.refreshToken = refreshToken;

        set({ user: parsedUser, isAuthenticated: true });
      }
    } catch (error) {
      console.error(
        "[Session Store] Hydration failed. Wiping corrupt data.",
        error,
      );
      // Fallback: If JSON parse fails, wipe storage to prevent infinite crash loops
      clientStorage.clearAll();
      set({ user: null, isAuthenticated: false });
    }
  },
}));
