import { useEffect, useRef, useState } from "react";
import { router } from "expo-router";

import { auth, getIdToken } from "@/src/config/firebase";
import { signInWithGoogleApi } from "@/src/features/auth/api/auth.api";
import { useAuthStore } from "@/src/features/auth/stores/auth.store";
/*
// Firebase phone provider functions - commented out due to missing Firebase Phone Auth keys
import {
  clearWebRecaptcha,
  confirmPhoneOtp,
  initWebRecaptcha,
  sendPhoneOtp,
} from "@/src/features/auth/utils/phone-provider";
*/
import { showAlert } from "@/src/utils/alert";

/**
 * **Phone Authentication Orchestrator**
 *
 * NOTE: OTP / Phone verification is temporarily disabled / bypassed
 * because Firebase Phone Auth / SMS keys are currently unavailable.
 *
 * Manages the multi-step flow of verifying a phone number via SMS (OTP).
 * This hook handles the interaction between the UI, the platform-specific OTP provider (Recaptcha/Native), and Firebase.
 */
export const usePhoneAuth = () => {
  const [loading, setLoading] = useState(false);

  // Tracks if the phone number is already taken by another account
  const [accountConflict, setAccountConflict] = useState(false);

  // Ref Lock: Prevents "Double Submit" race conditions synchronously
  const isSubmittingRef = useRef(false);

  // Use Store Actions for proper state/storage synchronization
  const { setVerificationId, verificationId, setSignupData, login } =
    useAuthStore();

  /*
  // Initialize Recaptcha on mount (Commented out: Phone OTP disabled)
  useEffect(() => {
    initWebRecaptcha();
    return () => clearWebRecaptcha();
  }, []);
  */

  /**
   * Sends the OTP to the provided phone number.
   * (Commented out active Firebase call: directly saves phone and moves to register wizard)
   * @param {string} phoneNumber - E.164 formatted string (e.g., +15550000000)
   */
  const sendOTP = async (phoneNumber: string) => {
    setLoading(true);
    try {
      /*
      // --- ORIGINAL FIREBASE OTP SEND (Commented out until Firebase keys restored) ---
      // 1. Trigger Platform-Specific Send
      const result = await sendPhoneOtp(phoneNumber);

      // Store ONLY the ID (String), not the whole object (Function)
      setVerificationId(result.verificationId);

      router.push("/(auth)/otp");
      */

      // Directly bypass OTP and store phone in signup data, then go to registration
      setSignupData({
        firebaseUser: {
          uid: auth.currentUser?.uid || "user",
          phoneNumber,
        },
      });
      router.replace("/(auth)/register");
    } catch (error: unknown) {
      /*
      clearWebRecaptcha();
      const err = error as { code?: string; message?: string };
      let message = "Failed to send OTP. Please try again.";
      if (err.code === "auth/invalid-phone-number") {
        message =
          "The phone number entered is invalid. Please check the country code and number.";
      } else if (err.code === "auth/too-many-requests") {
        message =
          "Too many attempts. Please wait a few minutes before trying again.";
      } else if (err.code === "auth/quota-exceeded") {
        message = "SMS quota exceeded for today. Please try again later.";
      } else if (err.code === "auth/billing-not-enabled") {
        message =
          "SMS billing is not enabled on this Firebase project. For development, add a Test Phone Number in Firebase Console (Authentication > Sign-in method > Phone > Phone numbers for testing) or upgrade to Blaze plan.";
      } else if (err.code === "auth/captcha-check-failed") {
        message = "reCAPTCHA verification failed. Please try again.";
      } else if (err.message) {
        message = err.message;
      }
      showAlert("OTP Error", message);
      */
      router.replace("/(auth)/register");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Verifies the code entered by the user.
   * (Commented out active Firebase call: navigates to registration)
   * @param {string} code - 6-digit SMS code
   */
  const verifyOTP = async (code: string) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setLoading(true);
    setAccountConflict(false);

    try {
      /*
      // --- ORIGINAL FIREBASE OTP VERIFICATION (Commented out until Firebase keys restored) ---
      // --- (A) Link Phone Credential ---
      try {
        await confirmPhoneOtp(verificationId, code);
      } catch (err: unknown) {
        const linkError = err as { code?: string };
        if (linkError.code !== "auth/provider-already-linked") {
          throw err;
        }
      }

      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Google session expired.");

      // --- (B) Exchange Token with Backend ---
      const idToken = await getIdToken(currentUser, true);
      const backendResponse = await signInWithGoogleApi({ idToken });

      // --- (C) Update Store Context ---
      setSignupData({
        firebaseUser: {
          uid: currentUser.uid,
          phoneNumber: currentUser.phoneNumber || undefined,
        },
      });

      // --- (D) Persistence (Via Store Action) ---
      login({
        id: backendResponse.userId || currentUser.uid,
        userId: backendResponse.userId || currentUser.uid,
        name: currentUser.displayName || "",
        email: currentUser.email || "",
        accessToken: backendResponse.accessToken || "",
        refreshToken: backendResponse.refreshToken,
        profileImageUrl: currentUser.photoURL,
        mobileNumber: currentUser.phoneNumber || undefined,
      });

      // --- (E) Cleanup & Navigate ---
      setVerificationId(null);
      */

      router.replace("/(auth)/register");
    } catch (err: unknown) {
      isSubmittingRef.current = false;
      const error = err as { code?: string; message?: string };

      if (
        error.code === "auth/credential-already-in-use" ||
        error.code === "auth/account-exists-with-different-credential"
      ) {
        setAccountConflict(true);
      } else if (error.code === "auth/requires-recent-login") {
        showAlert("Re-auth Required", "Please sign in with Google again.");
        router.replace("/(auth)/login");
      } else if (error.code === "auth/invalid-verification-code") {
        showAlert("Incorrect Code", "The code you entered is incorrect.");
      } else {
        showAlert("Verification Failed", error.message || "Unknown Error");
      }
    } finally {
      setLoading(false);
    }
  };

  return { sendOTP, verifyOTP, loading, accountConflict, setAccountConflict };
};
