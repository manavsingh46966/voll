import React from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Ionicons } from "@expo/vector-icons";

// --- STEP COMPONENTS ---
import { Step1PersonalDetails } from "@/src/features/auth/components/registration/Step1PersonalDetails";
import { Step2Interests } from "@/src/features/auth/components/registration/Step2Interests";
import { Step3Skills } from "@/src/features/auth/components/registration/Step3Skills";
// --- CUSTOM HOOKS ---
import { useRegistration } from "@/src/features/auth/hooks/userRegistration";

/**
 * **Registration Wizard Screen**
 *
 * The main container component for the multi-step registration process.
 * It orchestrates layout, navigation, and renders the specific step content based on state.
 *
 * **Key Features:**
 * - **Layout:** Wraps content in `SafeAreaView` and `KeyboardAvoidingView` for device adaptability.
 * - **Navigation:** Manages step progression (1 -> 2 -> 3) and back navigation.
 * - **State Integration:** Connects UI actions to the `useRegistration` business logic hook.
 *
 * @component
 * @returns {JSX.Element} The rendered wizard layout.
 */
export default function RegistrationScreen() {
  // Extract Logic from Custom Hook
  const {
    currentStep,
    totalSteps,
    handleContinue,
    handleBack,
    isSubmitting,
    isStepValid, // <--- Boolean: true if current step data is valid
  } = useRegistration();

  /**
   * Helper to determine button background color based on current validation state.
   *
   * - **Gray (bg-primary-disabled):** If the step is invalid or an API call is in progress.
   * - **Teal (bg-primary):** If the step is valid and ready to proceed.
   *
   * @returns {string} The Tailwind CSS class string for the background color.
   */
  const getButtonColor = () => {
    if (!isStepValid || isSubmitting) return "bg-primary-disabled"; // Locked state
    return "bg-primary"; // Active state (Primary Brand Color)
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* KeyboardAvoidingView ensures the 'Continue' button pushes up 
        when the keyboard opens on iOS. 
      */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-1 px-6 pt-2">
          {/* --- TOP NAVIGATION BAR --- */}
          <View className="mb-4 h-12 flex-row items-center justify-between">
            {/* Back Button */}
            <TouchableOpacity
              onPress={handleBack}
              activeOpacity={0.7}
              className="h-10 w-10 items-center justify-center rounded-full bg-gray-50 active:bg-gray-100"
              accessibilityLabel="Go back"
              accessibilityHint="Navigates to the previous step"
            >
              <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
            </TouchableOpacity>

            {/* Step Counter Indicator */}
            <Text className="font-medium text-neutral-gray">
              Step {currentStep} of {totalSteps}
            </Text>

            {/* Spacer for alignment */}
            <View className="w-10" />
          </View>

          {/* --- DYNAMIC STEP CONTENT --- */}
          <View className="flex-1">
            {/* We render the specific component based on 'currentStep'.
               State is preserved in Zustand, so unmounting components here is safe.
            */}
            {currentStep === 1 && <Step1PersonalDetails />}
            {currentStep === 2 && <Step2Interests />}
            {currentStep === 3 && <Step3Skills />}
          </View>

          {/* --- BOTTOM ACTION BAR --- */}
          <View className="bg-white pb-4 pt-2">
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityHint="Validates current input and proceeds"
              onPress={handleContinue}
              // Disable interaction if invalid or currently loading
              disabled={!isStepValid || isSubmitting}
              activeOpacity={0.8}
              // Apply dynamic styling for "Locked" vs "Active" look
              className={`h-[56px] w-full flex-row items-center justify-center space-x-2 rounded-xl shadow-sm ${getButtonColor()}`}
            >
              {isSubmitting ? (
                // Show Loader during API calls
                <ActivityIndicator color="white" />
              ) : (
                // Show Text based on context
                <Text className="text-lg font-bold text-white">
                  {currentStep === totalSteps ? "Finish" : "Continue"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
