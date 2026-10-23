import { GoogleSignin } from "@react-native-google-signin/google-signin";

/**
 * Configures the Native Google Sign-In SDK.
 * * * Must be called during app initialization (e.g., inside the root _layout).
 * * Uses the Web Client ID to allow backend token verification.
 */
export const configureGoogleSignIn = () => {
  try {
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_WEB_CLIENT_ID,
      scopes: ["profile", "email"],
      offlineAccess: false,
    });
  } catch (e) {
    console.error("[Google Config] Initialization failed:", e);
  }
};
