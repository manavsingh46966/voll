import { useMemo, useState } from "react";
import { useRouter } from "expo-router";

import { useAuthStore } from "@/src/features/auth/stores/auth.store";
import { clientStorage } from "@/src/lib/storage";
import { showAlert } from "@/src/utils/alert";

import { createAccountApi } from "../api/auth.api";
import {
  InterestsSchema,
  PersonalDetailsSchema,
  RegistrationSchema,
  SkillsSchema,
} from "../schemas/register.schema";
import { User } from "../types";

/**
 * **Custom Hook: Registration Flow Logic**
 *
 * Manages the state, navigation, and validation for the multi-step registration wizard.
 * Bridges the Zustand store (global state) with the Zod schemas (validation) and the UI.
 *
 * @returns {{
 * currentStep: number,
 * totalSteps: number,
 * isSubmitting: boolean,
 * isStepValid: boolean,
 * handleContinue: () => Promise<void>,
 * handleBack: () => void,
 * progress: number
 * }} Interface for controlling the registration UI.
 */
export const useRegistration = () => {
  const router = useRouter();

  // --- LOCAL STATE ---
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  // --- GLOBAL STORE ACCESS ---
  const {
    registrationData,
    setValidationErrors,
    clearOnboardingData,
    login, // Reserved for auto-login after success
  } = useAuthStore();

  const totalSteps = 3;

  /**
   * Real-time Validation Check (Memoized).
   * * Used to visually lock/unlock the "Continue" button.
   * Returns `true` only if the absolute minimum requirements for the current step are met.
   * * Rules enforced:
   * - Step 1: First/Last name > 1 char, Age is valid number, Gender selected, City > 1 char.
   * - Step 2: At least 1 Interest selected.
   * - Step 3: At least 1 Skill selected.
   * * @type {boolean}
   */
  const isStepValid = useMemo(() => {
    if (currentStep === 1) {
      const { firstName, lastName, age, gender, city } = registrationData;

      // 1. Name Check: Must be longer than 1 character (trimmed)
      const validFirstName = (firstName?.trim().length ?? 0) > 1;
      const validLastName = (lastName?.trim().length ?? 0) > 1;

      // 2. Age Check: Must be a non-empty string that parses to a number
      const validAge = age?.trim() !== "" && !isNaN(Number(age));

      // 3. Gender Check: Must be selected (non-empty string)
      const validGender = !!gender;

      // 4. City Check: Must be longer than 1 character
      const validCity = (city?.trim().length ?? 0) > 1;

      // Website is optional, so it is ignored here.
      return (
        validFirstName && validLastName && validAge && validGender && validCity
      );
    }

    if (currentStep === 2) {
      // Must have at least 1 interest selected
      return (
        registrationData.interests && registrationData.interests.length > 0
      );
    }

    if (currentStep === 3) {
      // Must have at least 1 skill selected
      return registrationData.skills && registrationData.skills.length > 0;
    }

    return false;
  }, [currentStep, registrationData]);

  /**
   * **Zod Schema Validation Helper**
   *
   * Runs the strict Zod validation (Regex, max lengths, etc.) against the current step's data.
   * If validation fails, it populates the `validationErrors` in the Zustand store.
   *
   * @returns {boolean} True if data satisfies the Zod schema, False otherwise.
   */
  const validateCurrentStep = (): boolean => {
    let schema;
    const dataToValidate = { ...registrationData };

    // --- Select Schema based on Step ---
    if (currentStep === 1) {
      schema = PersonalDetailsSchema;

      // DATA TRANSFORMATION:
      // The UI stores 'age' (string), but Zod Schema expects 'dateOfBirth' (Date).
      // We calculate the Date object on the fly for validation purposes.
      if (registrationData.age) {
        const ageNum = parseInt(registrationData.age, 10);
        if (!isNaN(ageNum)) {
          const today = new Date();
          // Create a date roughly 'ageNum' years ago
          const birthDate = new Date(
            today.setFullYear(today.getFullYear() - ageNum),
          );
          // @ts-expect-error - Dynamically adding property for Zod validation
          dataToValidate.dateOfBirth = birthDate;
        }
      }
    } else if (currentStep === 2) {
      schema = InterestsSchema;
    } else if (currentStep === 3) {
      schema = SkillsSchema;
    }

    // If no schema defined for step, pass by default
    if (!schema) return true;

    // Execute Zod Parse
    const result = schema.safeParse(dataToValidate);

    if (!result.success) {
      // Map Zod errors to simple Key-Value pairs for the UI
      const fieldErrors: Record<string, string> = {};
      Object.entries(result.error.flatten().fieldErrors).forEach(
        ([key, value]) => {
          if (value && value.length > 0) {
            fieldErrors[key] = value[0];
          }
        },
      );

      // Update Store with errors to show red text in UI
      setValidationErrors(fieldErrors);
      return false;
    }

    // Clear errors if valid
    setValidationErrors({});
    return true;
  };

  /**
   * Handler: Continue Button Press.
   * * 1. Checks strict validation (Zod).
   * 2. Moves to next step OR triggers final submission.
   */
  const handleContinue = async () => {
    // Double-check validation even if button was enabled (security best practice)
    const isValid = validateCurrentStep();
    if (!isValid) return;

    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
    } else {
      await handleRegister();
    }
  };

  /**
   * Handler: Back Button Press.
   * * Decrements the step counter. If at step 1, attempts to go back in router history.
   */
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    } else {
      if (router.canGoBack()) {
        router.back();
      }
    }
  };

  /**
   * Handler: Final API Submission.
   * * Called when the user clicks "Finish" on the last step.
   * Simulates an API call and handles success/error states.
   */
  const handleRegister = async () => {
    // --- 0. PREPARE DATA FOR VALIDATION ---
    // The Schema needs 'dateOfBirth', but our store has 'age'.
    // We must transform it exactly like we did in Step 1 validation.
    const dataToValidate = { ...registrationData };

    if (registrationData.age) {
      const ageNum = parseInt(registrationData.age, 10);
      if (!isNaN(ageNum)) {
        const today = new Date();
        const birthDate = new Date(
          today.setFullYear(today.getFullYear() - ageNum),
        );
        // @ts-expect-error - Dynamically adding property for Zod validation
        dataToValidate.dateOfBirth = birthDate;
      }
    }

    // --- 1. VALIDATION ---
    const finalValidation = RegistrationSchema.safeParse(dataToValidate);

    if (!finalValidation.success) {
      showAlert("Error", "Invalid profile data. Please check your inputs.");
      return;
    }

    setIsSubmitting(true); // Using local state 'isSubmitting' (or setLoading)

    try {
      // --- 2. SESSION CHECK ---
      const refreshToken = clientStorage.getItem("refresh_token");
      if (!refreshToken)
        throw new Error("Session expired. Please login again.");

      // --- 3. CONSTRUCT PAYLOAD ---
      // We use 'finalValidation.data' which now safely contains 'dateOfBirth'
      const validData = finalValidation.data;

      const payload = {
        name: `${validData.firstName} ${validData.lastName}`.trim(),
        dateOfBirth: validData.dateOfBirth.toISOString(), // Ensure ISO String for Backend
        gender: validData.gender,
        city: validData.city,
        email: validData.email,
        mobileNumber: validData.phone,
        website: validData.website || null,
        interests: validData.interests,
        skillsets: validData.skills,
      };

      // --- 4. API CALL ---
      const response = await createAccountApi(payload);

      // 5. SUCCESS HANDLING
      // Construct the full User object.
      // Note: We use the existing accessToken from storage (or the one refreshed by axios).
      // We don't need to manually grab it.
      const currentAccessToken = clientStorage.getItem("access_token") || "";

      const newUserSession: User = {
        id: response.userId || "generated-by-backend",
        userId: response.userId || "generated-by-backend",
        name: payload.name,
        email: payload.email,
        accessToken: currentAccessToken,
        refreshToken: response.refreshToken || refreshToken,
        profileImageUrl: registrationData.profileImage,
        city: payload.city,
        gender: payload.gender,
        dob: payload.dateOfBirth,
        mobileNumber: payload.mobileNumber,
      };

      // 'login' action handles all MMKV persistence.
      login(newUserSession);

      // Only clear data AFTER successful login persistence.
      clearOnboardingData();

      router.replace("/(drawer)/(tabs)/home");
    } catch (err: unknown) {
      console.error("Registration Error:", err);

      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };

      const serverMsg =
        error.response?.data?.message || error.message || "Unknown error";
      showAlert("Registration Failed", serverMsg);

      if (serverMsg.includes("expired") || serverMsg.includes("Unauthorized")) {
        router.replace("/(auth)/login");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    /** The current active step (1-based index) */
    currentStep,
    /** Total number of steps in the wizard */
    totalSteps,
    /** Boolean indicating if an API call is in progress */
    isSubmitting,
    /** Boolean indicating if the current step data meets minimum requirements (for button locking) */
    isStepValid,
    /** Function to proceed to next step */
    handleContinue,
    /** Function to go to previous step */
    handleBack,
    /** Progress value (0.0 - 1.0) for progress bars */
    progress: currentStep / totalSteps,
  };
};
