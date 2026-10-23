import { User } from "./domain.types";

/**
 * GLOBAL SESSION STORE INTERFACE
 * Defines the contract for the application-wide authentication state.
 */
export interface SessionState {
  // --- 1. SESSION STATE ---
  /** * The authenticated user object. Null indicates a "Guest".
   * Automatically hydrated from storage on app launch.
   */
  user: User | null;

  /** Quick boolean check for restricted routes. */
  isAuthenticated: boolean;

  // --- 2. ACTIONS ---
  /**
   * Persists the user session and updates the store.
   * @param {User} user - The normalized user object.
   */
  login: (user: User) => void;

  /**
   * Clears all session data and resets the store.
   */
  logout: () => void;

  /**
   * Restores the user session from storage on app launch.
   */
  hydrate: () => void;
}
