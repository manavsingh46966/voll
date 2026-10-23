import { useState } from "react";
import { router } from "expo-router";

import { auth, getIdToken } from "@/src/config/firebase";
import { signInWithGoogleApi } from "@/src/features/auth/api/auth.api";
import { useAuthStore } from "@/src/features/auth/stores/auth.store";
import { User } from "@/src/features/auth/types/domain.types";
import { performGoogleSignIn } from "@/src/features/auth/utils/google-provider";
import { getApiErrorMessage } from "@/src/lib/axios";
import { clientStorage } from "@/src/lib/storage";
import { showAlert } from "@/src/utils/alert";

/**
 * **Authentication Conflict State**
 *
 * Represents the specific error state when a user's intent matches the wrong account status.
 * - `USER_EXISTS`: User tried to Sign Up, but Google account is already linked to a profile.
 * - `USER_NOT_FOUND`: User tried to Log In, but no account exists for this Google ID.
 * - `null`: No conflict, standard flow proceeding.
 */
export type AuthConflictType = "USER_EXISTS" | "USER_NOT_FOUND" | null;

/**
 * **Google Authentication Orchestrator**
 *
 * A high-level hook that manages the entire lifecycle of a Google Sign-In attempt.
 * It acts as the bridge between the UI (Login/Signup screens), Firebase Auth, and the Backend API.
 *
 * **Key Responsibilities:**
 * 1. **OAuth Flow:** Triggers the native Google Sign-In sheet to get Firebase credentials.
 * 2. **Token Management:** Exchanges credentials for Backend Access/Refresh tokens and stores them.
 * 3. **Intent Resolution:** Compares the user's intent (`flow`) against their actual account status:
 * - **Scenario A (Conflict):** Intent "Login" + No Account → Returns `USER_NOT_FOUND`.
 * - **Scenario B (Conflict):** Intent "Signup" + Account Exists → Returns `USER_EXISTS`.
 * - **Scenario C (Success):** Intent "Signup" + No Account → Navigates to **Phone Verification**.
 * - **Scenario D (Success):** Intent "Login" + Account Exists → Navigates to **Home Dashboard**.
 *
 * @hook
 * @returns {{
 * signInWithGoogle: (flow: "login" | "signup") => Promise<void>,
 * isLoading: boolean,
 * conflictType: AuthConflictType,
 * clearConflict: () => void
 * }} An object containing the authentication trigger, loading state, and conflict helpers.
 */
export const useGoogleAuth = () => {
  const [loading, setLoading] = useState(false);
  const [conflictType, setConflictType] = useState<AuthConflictType>(null);

  const { setSignupData, login } = useAuthStore();

  const clearConflict = () => setConflictType(null);

  const signInWithGoogle = async (flow: "login" | "signup") => {
    setLoading(true);
    setConflictType(null);

    try {
      // 1. Google OAuth (Get Firebase Credential)
      const googleUser = await performGoogleSignIn();
      const currentUser = auth.currentUser;

      if (!currentUser) throw new Error("Firebase session not established.");

      // 2. Backend Handshake (Get Tokens)
      const idToken = await getIdToken(currentUser, true);

      let backendResponse;

      try {
        // Try to login
        backendResponse = await signInWithGoogleApi({ idToken });
      } catch (error: unknown) {
        const apiError = error as { response?: { status: number } };

        // CATCH THE 401 HERE
        if (apiError.response?.status === 401) {
          // 401 means "User Not Found" in your backend logic.
          // We manually construct a "New User" response.
          backendResponse = {
            isRegistered: false,
            refreshToken: "",
            accessToken: "",
            // other fields undefined
          };
        } else {
          // If it's a 500 or network error, re-throw it to stop everything
          throw apiError;
        }
      }

      // IMMEDIATE TOKEN STORAGE
      if (backendResponse.refreshToken) {
        clientStorage.setItem("refresh_token", backendResponse.refreshToken);
      }
      if (backendResponse.accessToken) {
        clientStorage.setItem("access_token", backendResponse.accessToken);
      }

      const backendUserId = backendResponse.userId || googleUser.uid;

      // 3. CHECK STATUS (Direct registration status check since Phone OTP is temporarily disabled)
      const isRegistered = Boolean(backendResponse.isRegistered);

      /*
      // --- ORIGINAL OTP FLOW (Commented out: Firebase Phone Auth keys not configured) ---
      const isPhoneLinked = !!currentUser.phoneNumber;

      // --- FLOW CHECK A: Signup Flow but User Exists ---
      if (flow === "signup" && isPhoneLinked) {
        setConflictType("USER_EXISTS");
        setLoading(false);
        return;
      }

      // --- FLOW CHECK B: Login Flow but User Not Registered ---
      if (flow === "login" && !isPhoneLinked) {
        setSignupData({
          googleData: googleUser,
          firebaseUser: {
            uid: currentUser.uid,
            phoneNumber: currentUser.phoneNumber || undefined,
          },
        });
        setConflictType("USER_NOT_FOUND");
        setLoading(false);
        return;
      }

      // --- FLOW CHECK C: Signup Flow (Happy Path) ---
      if (flow === "signup" && !isPhoneLinked) {
        setSignupData({
          googleData: googleUser,
          firebaseUser: {
            uid: currentUser.uid,
            phoneNumber: currentUser.phoneNumber || undefined,
          },
        });

        setLoading(false);

        router.push("/(auth)/phone");
        return;
      }
      */

      // --- DIRECT FLOW WITHOUT PHONE OTP ---
      // Flow Check A: User clicked "Sign Up" but account already exists
      if (flow === "signup" && isRegistered) {
        setConflictType("USER_EXISTS");
        setLoading(false);
        return;
      }

      // Flow Check B: User clicked "Login" but profile is not registered yet
      if (flow === "login" && !isRegistered) {
        setSignupData({
          googleData: googleUser,
          firebaseUser: {
            uid: currentUser.uid,
            phoneNumber: currentUser.phoneNumber || undefined,
          },
        });
        setConflictType("USER_NOT_FOUND");
        setLoading(false);
        return;
      }

      // Flow Check C: Signup Flow (Happy Path) -> Direct to Registration wizard (Bypassing Phone OTP)
      if (flow === "signup" && !isRegistered) {
        setSignupData({
          googleData: googleUser,
          firebaseUser: {
            uid: currentUser.uid,
            phoneNumber: currentUser.phoneNumber || undefined,
          },
        });

        setLoading(false);

        router.push("/(auth)/register");
        return;
      }

      // --- FLOW CHECK D: Login Flow (Happy Path) ---
      // User clicked "Login" AND they are Existing.
      // Action: Log them in.
      const user: User = {
        id: backendUserId,
        userId: backendUserId,
        name: googleUser.displayName || "User",
        email: googleUser.email,
        accessToken: backendResponse.accessToken || "",
        refreshToken: backendResponse.refreshToken,
        profileImageUrl: googleUser.photoURL,
        mobileNumber: currentUser.phoneNumber || undefined,
      };

      login(user);
      router.replace("/(drawer)/(tabs)/home");
    } catch (error: unknown) {
      console.error("Google Sign-In Error:", error);
      const message = getApiErrorMessage(error, "Unknown error occurred");
      setLoading(false);
      showAlert("Sign In Error", message);
    }
  };

  return {
    signInWithGoogle,
    isLoading: loading,
    conflictType,
    clearConflict,
  };
};
