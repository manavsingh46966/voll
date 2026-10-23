import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ActionModal } from "@/src/components/ui/ActionModal";
// --- Architecture Imports ---
import { LoadingModal } from "@/src/components/ui/LoadingModal";
import { GoogleAuthButton } from "@/src/features/auth/components/ui/GoogleAuthButton";
import {
  AuthConflictType,
  useGoogleAuth,
} from "@/src/features/auth/hooks/useGoogleAuth";

/**
 * **Login Screen**
 *
 * The primary entry point for unauthenticated users.
 * It orchestrates the Google OAuth flow and intelligently handles account conflicts.
 *
 * **Key Features:**
 * - **Dual Intent:** distinct buttons for "Sign Up" vs "Login" that trigger the same OAuth provider but with different backend intents.
 * - **Conflict Resolution:** If a user tries to "Sign Up" but has an account, it prompts them to Login (and vice versa).
 * - **Feedback:** Manages global loading states and modal overlays.
 *
 * @component
 * @returns {JSX.Element} The rendered authentication screen.
 */
export default function LoginScreen() {
  const { signInWithGoogle, isLoading, conflictType, clearConflict } =
    useGoogleAuth();

  /**
   * Derives the UI configuration for the Conflict Modal based on the auth error type.
   * - **USER_EXISTS:** Prompts user to switch to Login flow.
   * - **USER_NOT_FOUND:** Prompts user to switch to Registration flow.
   *
   * @param {AuthConflictType} type - The current conflict state from the auth hook.
   * @returns {object | null} Configuration object for `ActionModal` or null if no conflict.
   */
  const getModalContent = (type: AuthConflictType) => {
    if (type === "USER_EXISTS") {
      return {
        title: "Account Already Exists",
        message:
          "You already have an account linked to this Google ID. Please login to continue.",
        actionLabel: "Go to Login",
        nextFlow: "login" as const,
      };
    }
    if (type === "USER_NOT_FOUND") {
      return {
        title: "Account Not Found",
        message:
          "We couldn't find an account for this Google ID. Would you like to create a new one?",
        actionLabel: "Sign Up Now",
        nextFlow: "signup" as const,
      };
    }
    return null;
  };

  const modalContent = getModalContent(conflictType);

  /**
   * Switches the user to the correct flow based on the conflict.
   */
  const handleConflictAction = () => {
    if (!modalContent) return;

    const flowToTrigger = modalContent.nextFlow;
    clearConflict();

    // Small delay to allow Modal to unmount smoothly before new OAuth starts
    setTimeout(() => {
      signInWithGoogle(flowToTrigger);
    }, 300);
  };

  return (
    <SafeAreaView className="flex-1 justify-between bg-white px-6 py-10">
      {/* 1. Global Loading Overlay */}
      <LoadingModal visible={isLoading} />

      {/* 2. Dynamic Conflict Modal */}
      {modalContent && (
        <ActionModal
          visible={!!conflictType}
          title={modalContent.title}
          message={modalContent.message}
          actionLabel={modalContent.actionLabel}
          onAction={handleConflictAction}
          secondaryLabel="Cancel"
          onSecondary={clearConflict}
        />
      )}

      {/* 3. Branding Section */}
      <View className="flex-1 items-center justify-center">
        <Image
          source={require("@/assets/images/logo.png")}
          className="mb-8 h-48 w-48"
          resizeMode="contain"
        />
        <Text className="text-4xl font-bold tracking-wider text-primary">
          VolStory
        </Text>
      </View>

      {/* 4. Action Section */}
      <View className="mb-8 w-full items-center">
        {/* PRIMARY ACTION: SIGN UP */}
        <GoogleAuthButton
          onPress={() => signInWithGoogle("signup")}
          isLoading={isLoading}
          label="Sign-up with Google"
        />

        {/* SECONDARY ACTION: LOGIN SWITCH */}
        <View className="mt-4 flex-row items-center justify-center">
          <Text className="text-base text-neutral-gray">
            Already have an account?{" "}
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => signInWithGoogle("login")}
            disabled={isLoading}
            activeOpacity={0.7}
            className="p-1"
          >
            <Text className="text-base font-bold text-primary">Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
