/**
 * Configures the Google Sign-In SDK (Web No-Op).
 *
 * * On Web, Google Sign-In is handled automatically by the Firebase JS SDK
 * * (via `GoogleAuthProvider` in `firebase.web.ts`).
 * * This function exists solely to satisfy the cross-platform contract.
 */
export const configureGoogleSignIn = () => {
  // No-op for Web
};
