import { create } from "zustand";

import { clientStorage } from "@/src/lib/storage";
import { useSessionStore } from "@/src/stores/session.store";

import { AuthState, User } from "../types"; // ✅ Imported from Types folder

/**
 * Global Authentication Store (Zustand).
 * Manages Session, Tokens, and Onboarding Form State.
 * * * @see AuthState for interface definitions.
 */
export const useAuthStore = create<AuthState>((set) => ({
  // --- INITIAL STATE ---
  user: null,
  isAuthenticated: false,
  verificationId: null,
  signupData: {},
  validationErrors: {},
  registrationData: {
    firstName: "",
    lastName: "",
    age: "",
    gender: "",
    city: "",
    phone: "",
    email: "",
    website: "",
    profileImage: null,
    interests: [],
    skills: [],
  },

  // --- ACTIONS ---

  /**
   * Stores the verification ID (String) returned by the OTP provider to state.
   * This ID is required later to confirm the code entered by the user.
   *
   * @param {string | null} id - The verification ID or null to reset.
   * @returns {void}
   */
  setVerificationId: (id) => set({ verificationId: id }),

  /**
   * Logs the user in by saving tokens to storage and updating state.
   * @param {User} user
   */
  login: (user) => {
    // Persistence Logic
    clientStorage.setItem("access_token", user.accessToken);
    clientStorage.setItem("refresh_token", user.refreshToken);
    clientStorage.setItem("user_data", JSON.stringify(user));

    // Clear draft data from disk on successful login
    clientStorage.removeItem("signup_data");
    clientStorage.removeItem("registration_data");

    // State Update
    set({ user, isAuthenticated: true });

    // Sync to session store so arya_vol features (stories, profile, groups, etc.) work
    useSessionStore.getState().login(user as any);
  },

  /**
   * Logs the user out by clearing storage and resetting state.
   */
  logout: () => {
    // Clear Persistence
    clientStorage.removeItem("access_token");
    clientStorage.removeItem("refresh_token");
    clientStorage.removeItem("user_data");

    // Also clear draft data on full logout to prevent data leaks
    clientStorage.removeItem("signup_data");
    clientStorage.removeItem("registration_data");

    // Reset State (Keep Empty Objects consistent with Type)
    set({
      user: null,
      isAuthenticated: false,
      signupData: {},
      verificationId: null,
      validationErrors: {},
      registrationData: {
        firstName: "",
        lastName: "",
        age: "",
        gender: "",
        city: "",
        phone: "",
        email: "",
        website: "",
        profileImage: null,
        interests: [],
        skills: [],
      },
    });

    // Sync logout to session store
    useSessionStore.getState().logout();
  },

  /**
   * Rehydrates the store from persistent storage on app launch.
   */
  hydrate: () => {
    try {
      const accessToken = clientStorage.getItem("access_token");
      const refreshToken = clientStorage.getItem("refresh_token");
      const userData = clientStorage.getItem("user_data");

      // Hydrate Drafts
      const signupData = clientStorage.getItem("signup_data");
      const regData = clientStorage.getItem("registration_data");

      if (refreshToken && userData) {
        // Safe Parse & Restore
        const parsedUser = JSON.parse(userData) as User;

        // Ensure we use the latest token from storage
        parsedUser.accessToken = accessToken || parsedUser.accessToken;
        parsedUser.refreshToken = refreshToken;

        set({ user: parsedUser, isAuthenticated: true });
      }

      // Restore Drafts
      if (signupData) set({ signupData: JSON.parse(signupData) });
      if (regData) set({ registrationData: JSON.parse(regData) });
    } catch (error) {
      console.error("[Auth Store] Hydration failed:", error);
      clientStorage.clearAll();
      set({ user: null, isAuthenticated: false });
    }
  },

  /**
   * Updates Signup Data (Merge Strategy).
   * @param {Partial<SignupFlowData>} data
   * @returns {void}
   */
  setSignupData: (data) =>
    set((state) => {
      const newData = { ...state.signupData, ...data };

      // Auto-Persist
      clientStorage.setItem("signup_data", JSON.stringify(newData));
      return { signupData: newData };
    }),

  /**
   * Updates Registration Data and clears specific field errors.
   * @param {Partial<RegistrationData>} data
   * @returns {void}
   */
  setRegistrationData: (data) =>
    set((state) => {
      // FIX: Use filter instead of 'delete' to remove cleared errors immutably
      const keysToClear = Object.keys(data);
      const newErrors = Object.fromEntries(
        Object.entries(state.validationErrors).filter(
          ([key]) => !keysToClear.includes(key),
        ),
      );

      const newData = { ...state.registrationData, ...data };

      clientStorage.setItem("registration_data", JSON.stringify(newData));

      return {
        registrationData: newData,
        validationErrors: newErrors,
      };
    }),

  /**
   * Sets the validation error map.
   * @param {Record<string, string>} errors
   * @returns {void}
   */
  setValidationErrors: (errors) => set({ validationErrors: errors }),

  /**
   * Resets only the onboarding data (Steps), keeping the user session alive.
   * @returns {void}
   */
  clearOnboardingData: () => {
    // Remove drafts from disk
    clientStorage.removeItem("signup_data");
    clientStorage.removeItem("registration_data");

    set({
      signupData: {},
      verificationId: null,
      validationErrors: {},
      registrationData: {
        firstName: "",
        lastName: "",
        age: "",
        gender: "",
        city: "",
        phone: "",
        email: "",
        website: "",
        profileImage: null,
        interests: [],
        skills: [],
      },
    });
  },
}));
