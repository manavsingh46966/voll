import type { FirebaseAuthTypes } from "@react-native-firebase/auth";
import {
  linkWithCredential,
  PhoneAuthProvider,
  signInWithPhoneNumber,
} from "@react-native-firebase/auth";

import { auth } from "@/src/config/firebase";

/**
 * Initializes Recaptcha (Native No-Op).
 * * On Native (iOS/Android), Firebase uses silent APNs/SafetyNet verification
 * * instead of the visible Recaptcha widget used on Web.
 * * This function exists to satisfy the shared interface.
 */
export const initWebRecaptcha = async (): Promise<void> => {
  // No-op for Native
};

/**
 * Clears Recaptcha (Native No-Op).
 * * No cleanup required for Native verification.
 */
export const clearWebRecaptcha = (): void => {
  // No-op for Native
};

/**
 * Sends an OTP to the specified phone number using the Native SDK.
 * * * Native Specifics:
 * * - Does NOT require a RecaptchaVerifier.
 * * - Automatically handles SMS retrieval on some Android versions.
 * * @param {string} phoneNumber - The phone number in E.164 format.
 * @param phoneNumber
 * @returns {Promise<FirebaseAuthTypes.ConfirmationResult>} The confirmation result containing the verification ID.
 * @throws {Error} If the phone number is invalid or quota is exceeded.
 */
export const sendPhoneOtp = async (
  phoneNumber: string,
): Promise<FirebaseAuthTypes.ConfirmationResult> => {
  return signInWithPhoneNumber(auth, phoneNumber);
};

/**
 * Verifies the OTP and links the Phone Credential to the current user.
 * * * Flow:
 * 1. Creates a Phone Credential using the verification ID and user code.
 * 2. Retrieves the currently signed-in user (from Google Sign-In step).
 * 3. Links the new credential to the existing user account.
 * * @param {string} verificationId - The ID returned from `sendPhoneOtp`.
 * @param verificationId
 * @param {string} code - The 6-digit SMS code.
 * @returns {Promise<FirebaseAuthTypes.UserCredential>} The updated user credential.
 * @throws {Error} If the session is invalid or code is incorrect.
 */
export const confirmPhoneOtp = async (
  verificationId: string,
  code: string,
): Promise<FirebaseAuthTypes.UserCredential> => {
  // 1. Create Credential
  const credential = PhoneAuthProvider.credential(verificationId, code);

  // 2. Get Current User
  const user = auth.currentUser;
  if (!user) throw new Error("User session missing during linking.");

  // 3. Link (MODULAR SYNTAX)
  // We pass the 'user' instance explicitly to match the Modular API signature.
  return linkWithCredential(user, credential);
};
