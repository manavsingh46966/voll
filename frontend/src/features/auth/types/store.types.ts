import { User } from "./domain.types";
import { RegistrationData, SignupFlowData } from "./form.types";

/**
 * STORE INTERFACE
 * Defines the contract for the global Zustand Auth Store.
 * This interface combines:
 * 1. Persistent Session State (User, Tokens)
 * 2. Transient UI State (Wizard Forms, Validation Errors)
 * 3. Actions to mutate this state.
 */
export interface AuthState {
  // --- 1. SESSION STATE ---

  /** * The authenticated user object.
   * Null indicates the user is a "Guest".
   * Automatically hydrated from storage on app launch.
   */
  user: User | null;

  /** * Quick boolean check for restricted routes.
   * True if 'user' is present and tokens are valid.
   */
  isAuthenticated: boolean;

  // --- 2. ONBOARDING & WIZARD STATE ---

  /** * Temporary context held while switching between Auth Providers and Registration.
   * e.g., Holds the Google Profile data before the user confirms their account details.
   */
  signupData: SignupFlowData;

  /** * The Verification ID returned by Firebase Phone Auth.
   * Stored here (instead of local state) to survive navigation between the "Phone Input"
   * and "OTP Verification" screens.
   */
  verificationId: string | null;

  /** * The draft data for the Registration Form.
   * Accumulates inputs across multiple wizard steps.
   */
  registrationData: RegistrationData;

  // --- 3. UI STATE ---

  /** * Validation errors for form fields.
   * Key: Field Name (e.g., 'email'), Value: Error Message.
   * Used to display inline red error text in the UI.
   */
  validationErrors: Record<string, string>;

  // --- 4. ACTIONS ---

  /**
   * Persists the user session and updates the store.
   * * Side Effect: Saves tokens to MMKV/LocalStorage.
   * @param {User} user - The standardized user object received from the backend.
   */
  login: (user: User) => void;

  /**
   * Clears all session data and resets the store.
   * * Side Effect: Removes tokens from MMKV/LocalStorage.
   * * Side Effect: Resets all wizard state to default.
   */
  logout: () => void;

  /**
   * Restores the user session from MMKV/LocalStorage on app launch.
   * Checks for existing tokens and re-populates the 'user' object.
   */
  hydrate: () => void;

  /**
   * Updates the temporary signup flow context.
   * Uses a partial merge strategy (only updates provided keys).
   * @param {Partial<SignupFlowData>} data - Data to merge into state.
   */
  setSignupData: (data: Partial<SignupFlowData>) => void;

  /**
   * Stores the Phone Auth Verification ID.
   * @param {string | null} id - The ID string from Firebase.
   */
  setVerificationId: (id: string | null) => void;

  /**
   * Updates registration form fields and automatically clears associated errors.
   * * UX Feature: If a user types in a field that had an error, the error is removed.
   * @param {Partial<RegistrationData>} data - Field updates (e.g., { firstName: 'John' }).
   */
  setRegistrationData: (data: Partial<RegistrationData>) => void;

  /**
   * Sets validation errors (usually from Zod or Backend response).
   * @param {Record<string, string>} errors - Map of field names to error messages.
   */
  setValidationErrors: (errors: Record<string, string>) => void;

  /**
   * Resets wizard state (called on unmount or success).
   * Keeps the user logged in, but clears the form and temporary signup data.
   */
  clearOnboardingData: () => void;
}
