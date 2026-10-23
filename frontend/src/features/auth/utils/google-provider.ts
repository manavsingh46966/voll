import {
  GoogleAuthProvider,
  signInWithCredential,
} from "@react-native-firebase/auth";
import {
  GoogleSignin,
  isSuccessResponse,
} from "@react-native-google-signin/google-signin";

import { auth, UserCredential } from "@/src/config/firebase";
import { GoogleUserResult } from "@/src/features/auth/types";

/**
 * **Native Google Sign-In Implementation**
 *
 * Orchestrates the full OAuth flow using the Native SDKs (Google Sign-In + Firebase).
 * It handles the exchange of tokens and normalizes the user profile for the app.
 *
 * **Key Flow:**
 * 1. **Environment Check:** Verifies Google Play Services availability.
 * 2. **Session Cleanup:** Forces a sign-out to ensure the account picker is always shown.
 * 3. **Native Auth:** Opens the system modal for account selection.
 * 4. **Token Exchange:** Swaps the Google ID Token for a Firebase Credential.
 *
 * @returns {Promise<GoogleUserResult>} The normalized user profile containing UID, email, and photo.
 * @throws {Error} If the user cancels the modal, network fails, or no ID Token is returned.
 */
export const performGoogleSignIn = async (): Promise<GoogleUserResult> => {
  // 1. Check Play Services
  await GoogleSignin.hasPlayServices();

  try {
    // Force sign-out to ensure the account picker always appears
    await GoogleSignin.signOut();
  } catch (error) {
    // Ignore error if user wasn't signed in; this is a cleanup step.
  }

  // 2. Perform Native Sign-In
  const response = await GoogleSignin.signIn();

  if (!isSuccessResponse(response)) {
    throw new Error("Sign in flow was cancelled or failed.");
  }

  // Safe Access for v10 / v11 compatibility
  const idToken = response.data.idToken;

  if (!idToken) {
    throw new Error("Google Sign-In failed: No ID Token found.");
  }

  // 3. Create Credential (MODULAR SYNTAX)
  const googleCredential = GoogleAuthProvider.credential(idToken);

  // 4. Sign-In (MODULAR SYNTAX)
  // We use the 'auth' instance exported from our config to ensure consistency.
  const userCred: UserCredential = await signInWithCredential(
    auth,
    googleCredential,
  );
  const user = userCred.user;

  return {
    uid: user.uid,
    email: user.email || "",
    displayName: user.displayName || "",
    photoURL: user.photoURL || "",
  };
};
