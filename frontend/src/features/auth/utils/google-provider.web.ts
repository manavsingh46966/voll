import { Auth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

import { auth } from "@/src/config/firebase";
import { GoogleUserResult } from "@/src/features/auth/types";

/**
 * **Web Google Sign-In Implementation**
 *
 * Orchestrates the OAuth flow using the standard Firebase Web SDK.
 * Unlike the native implementation, this utilizes a browser popup window.
 *
 * **Key Flow:**
 * 1. **Provider Setup:** Initializes Google Auth with `profile` and `email` scopes.
 * 2. **Forced Selection:** Sets `prompt: 'select_account'` to ensure the user can switch accounts (parity with Native 'signOut').
 * 3. **Type Bridging:** Casts the shared `auth` instance to the Web SDK's `Auth` type to enable `signInWithPopup`.
 *
 * @returns {Promise<GoogleUserResult>} The normalized user profile containing UID, email, and photo.
 * @throws {Error} If the popup is closed by the user or network/configuration fails.
 */
export const performGoogleSignIn = async (): Promise<GoogleUserResult> => {
  const provider = new GoogleAuthProvider();
  provider.addScope("profile");
  provider.addScope("email");

  // Forces the account selection screen, preventing auto-login loops.
  provider.setCustomParameters({
    prompt: "select_account",
  });

  // Explicitly tell TypeScript "Trust me, this is the Web Auth"
  // We cast it to 'unknown' first to clear the Native type, then to 'Auth'.
  const webAuth = auth as unknown as Auth;

  const result = await signInWithPopup(webAuth, provider);
  const user = result.user;

  return {
    uid: user.uid,
    email: user.email || "",
    displayName: user.displayName || "",
    photoURL: user.photoURL || "",
  };
};
