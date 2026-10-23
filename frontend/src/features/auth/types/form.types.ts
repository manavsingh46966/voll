import { GoogleUserResult } from "./domain.types";

/**
 * FORM & WIZARD MODELS
 * Temporary state containers used during user input flows (Onboarding/Registration).
 * These types are exclusive to the client-side wizard and are not directly sent to the API
 * until the final submission step.
 */

/**
 * The Accumulator for the Multi-Step Registration Wizard.
 * This interface holds the draft data as the user progresses through screens.
 * * It allows for partial updates and persistence if the user navigates back.
 */
export interface RegistrationData {
  // --- Step 1: Personal Information ---

  /** User's First Name. Required. */
  firstName: string;

  /** User's Last Name. Required. */
  lastName: string;

  /** User's Age. Stored as string to handle text input, validated as number later. */
  age: string;

  /** User's Gender Identity. Selection from a predefined list. */
  gender: string;

  /** User's City of Residence. */
  city: string;

  // --- Contact Information (Pre-filled / Locked) ---

  /** * User's Phone Number.
   * Pre-filled if they signed up via Phone Auth.
   * Otherwise collected manually.
   */
  phone: string;

  /** * User's Email Address.
   * Pre-filled if they signed up via Google.
   * Otherwise collected manually.
   */
  email: string;

  // --- Step 2: Professional / Optional ---

  /** Portfolio or Personal Website URL. Optional. */
  website: string;

  /** Local URI or Remote URL of the profile picture. Null if skipped. */
  profileImage: string | null;

  // --- Step 3: Preferences ---

  /** List of selected interest tags (e.g., "Technology", "Art"). */
  interests: string[];

  /** List of selected professional skills. */
  skills: string[];
}

/**
 * Onboarding Flow Context.
 * Bridges the gap between the "Sign In" providers and the "Registration Wizard".
 * This data is transient and used only to pre-fill the RegistrationData.
 */
export interface SignupFlowData {
  /** * Data received from Google Sign-In (if applicable).
   * Used to pre-fill name, email, and photo in Step 1.
   */
  googleData?: GoogleUserResult;

  /** * The verified phone number from the OTP step (if applicable).
   * Used to pre-fill the phone field in Step 1.
   */
  phoneNumber?: string;

  /** * The raw Firebase Auth Identity.
   * Critical for linking the backend account to the Firebase UID during account creation.
   */
  firebaseUser?: {
    /** The Firebase Unique ID. */
    uid: string;
    /** The phone number associated with the Firebase account. */
    phoneNumber?: string;
  };
}
