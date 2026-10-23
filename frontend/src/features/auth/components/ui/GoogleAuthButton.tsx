import React from "react";
import { ActivityIndicator, Image, Text, TouchableOpacity } from "react-native";

interface GoogleAuthButtonProps {
  /** Function to trigger the Google Sign-In flow */
  onPress: () => void;
  /** If true, disables interaction and shows a spinner */
  isLoading?: boolean;
  /** Button text label. Defaults to "Sign-up with Google" */
  label?: string;
}

/**
 * **Google Authentication Button**
 *
 * A specialized button component designed for initiating the Google OAuth flow.
 * It strictly adheres to the brand guidelines (Logo placement) and the app's design system.
 *
 * **Key Features:**
 * - **State Handling:** Automatically swaps the logo for a spinner and disables clicks when `isLoading` is true.
 * - **Feedback:** Provides visual opacity changes on press and load.
 * - **Reusability:** Configurable label allows use in both "Sign In" and "Sign Up" contexts.
 *
 * @component
 * @example
 * <GoogleAuthButton
 * onPress={handleGoogleSignIn}
 * isLoading={isAuthenticating}
 * label="Continue with Google"
 * />
 *
 * @param {GoogleAuthButtonProps} props - Configuration properties.
 * @returns {JSX.Element} A touchable button with the Google logo or a loading indicator.
 */
export const GoogleAuthButton = ({
  onPress,
  isLoading = false,
  label = "Sign-up with Google",
}: GoogleAuthButtonProps) => {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      onPress={onPress}
      disabled={isLoading}
      activeOpacity={0.7}
      className={`mb-6 h-[52px] w-full max-w-2xl flex-row items-center justify-center rounded-xl border border-primary bg-white ${
        isLoading ? "opacity-70" : "active:bg-gray-50"
      }`}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color="#01A39F" className="mr-3" />
      ) : (
        <Image
          source={require("@/assets/images/google.png")}
          className="mr-3 h-6 w-6"
          resizeMode="contain"
        />
      )}

      <Text className="text-lg font-bold text-primary">
        {isLoading ? "Please wait..." : label}
      </Text>
    </TouchableOpacity>
  );
};
