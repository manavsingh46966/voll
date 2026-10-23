import {
  Auth,
  ConfirmationResult,
  linkWithCredential,
  PhoneAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  UserCredential,
} from "firebase/auth";

import { auth } from "@/src/config/firebase";

// Extend the Window interface to store the global Recaptcha instance
declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier | undefined;
  }
}

/**
 * Helper to get the Auth instance casted correctly for the Web SDK.
 * This prevents TypeScript from complaining that we are passing a "Native" object
 * to functions designed for the "Web" namespace (like `signInWithPopup`).
 *
 * @returns {Auth} The Firebase Auth instance typed for the Web SDK.
 */
const getWebAuth = (): Auth => {
  return auth as unknown as Auth;
};

/**
 * **Initialize Invisible Recaptcha**
 *
 * Sets up the Firebase Recaptcha Verifier required for web-based phone authentication.
 * It attaches to a DOM element with ID `recaptcha-container` to prevent abuse.
 *
 * @returns {Promise<RecaptchaVerifier | undefined>} Resolves with the verifier instance.
 */
export const initWebRecaptcha = async (): Promise<RecaptchaVerifier | undefined> => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return undefined;
  }

  const webAuth = getWebAuth();

  if (window.recaptchaVerifier) {
    return window.recaptchaVerifier;
  }

  const container = document.getElementById("recaptcha-container");
  if (!container) {
    console.warn("[PhoneAuth] 'recaptcha-container' element not found in DOM.");
    return undefined;
  }

  // Clear any existing DOM nodes inside container to avoid 'already rendered' error
  container.innerHTML = "";

  try {
    const verifier = new RecaptchaVerifier(
      webAuth,
      "recaptcha-container",
      {
        size: "invisible",
        callback: () => {
          // Solved
        },
        "expired-callback": () => {
          clearWebRecaptcha();
        },
      },
    );
    window.recaptchaVerifier = verifier;
    return verifier;
  } catch (err: unknown) {
    console.warn("[PhoneAuth] Recaptcha Init Error, attempting clean recovery:", err);
    clearWebRecaptcha();
    try {
      const freshContainer = document.getElementById("recaptcha-container");
      if (freshContainer) {
        freshContainer.innerHTML = "";
      }
      const verifier = new RecaptchaVerifier(
        webAuth,
        "recaptcha-container",
        {
          size: "invisible",
        },
      );
      window.recaptchaVerifier = verifier;
      return verifier;
    } catch (retryErr) {
      console.error("[PhoneAuth] Recaptcha Init Recovery Failed:", retryErr);
      return undefined;
    }
  }
};

/**
 * **Teardown Recaptcha Instance**
 *
 * Cleans up the global Recaptcha verifier and its container DOM nodes.
 */
export const clearWebRecaptcha = (): void => {
  if (typeof window !== "undefined") {
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch (err) {
        console.warn("[PhoneAuth] Warning during recaptcha clear:", err);
      }
      window.recaptchaVerifier = undefined;
    }
    const container = document.getElementById("recaptcha-container");
    if (container) {
      container.innerHTML = "";
    }
  }
};

/**
 * **Send OTP (Web Implementation)**
 *
 * Triggers the SMS delivery to the specified phone number using Firebase's `signInWithPhoneNumber`.
 * Automatically initializes the Recaptcha verifier if it hasn't been started yet.
 *
 * @param {string} phoneNumber - The target phone number in E.164 format (e.g., +15555555555).
 * @returns {Promise<ConfirmationResult>} The confirmation result object.
 */
export const sendPhoneOtp = async (
  phoneNumber: string,
): Promise<ConfirmationResult> => {
  const webAuth = getWebAuth();

  let verifier = window.recaptchaVerifier;
  if (!verifier) {
    verifier = await initWebRecaptcha();
  }

  if (!verifier) {
    // Retry fresh initialization once
    clearWebRecaptcha();
    verifier = await initWebRecaptcha();
  }

  if (!verifier) {
    throw new Error(
      "Recaptcha verification could not be initialized. Please refresh the page and try again.",
    );
  }

  try {
    return await signInWithPhoneNumber(
      webAuth,
      phoneNumber,
      verifier,
    );
  } catch (err: unknown) {
    // Reset verifier so subsequent attempts get a fresh challenge
    clearWebRecaptcha();
    throw err;
  }
};

/**
 * **Verify OTP & Link Credential (Web Implementation)**
 *
 * Finalizes the phone authentication by verifying the user's 6-digit code.
 * It then links this new phone credential to the currently signed-in user session.
 *
 * **Key Difference:**
 * - Uses the modular `linkWithCredential` standalone function instead of the object-oriented method found in older SDKs.
 *
 * @param {string} verificationId - The unique ID returned by `sendPhoneOtp`.
 * @param {string} code - The 6-digit SMS code entered by the user.
 * @returns {Promise<UserCredential>} The updated user credential with the phone number successfully linked.
 * @throws {Error} If the user session is missing or the code is invalid.
 */
export const confirmPhoneOtp = async (
  verificationId: string,
  code: string,
): Promise<UserCredential> => {
  const webAuth = getWebAuth();

  // 1. Create Credential
  const credential = PhoneAuthProvider.credential(verificationId, code);

  // 2. Get User (Must be from the WEB typed auth)
  const user = webAuth.currentUser;

  if (!user) throw new Error("User session missing during linking.");

  // 3. Link (Web Syntax: Standalone function)
  return linkWithCredential(user, credential);
};
