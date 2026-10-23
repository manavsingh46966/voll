import React from "react";
import { Stack } from "expo-router";

/**
 * **Authentication Layout (`(auth)/_layout.tsx`)**
 *
 * This component acts as the Layout Route for the Authentication group.
 * It defines the navigation stack structure for all auth-related screens
 * (Login, Phone Verification, OTP, Registration).
 *
 * **Key Features:**
 * - Uses `Stack` navigation.
 * - Applies global transition animations (`slide_from_right`) for a native feel.
 * - Configures global header styles (Fonts, alignment, shadow).
 *
 * @component
 * @example
 * // Utilized automatically by Expo Router
 *
 * @returns {JSX.Element} The Stack Navigator configured for the Auth flow.
 */
export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerShadowVisible: false,
        headerTitleStyle: {
          fontFamily: "Nunito-Bold",
        },
        animation: "slide_from_right",
        headerTitleAlign: "center",
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen
        name="phone"
        options={{ headerShown: true, title: "Verification" }}
      />
      <Stack.Screen name="otp" options={{ headerShown: true, title: "OTP" }} />
      <Stack.Screen name="register" options={{ headerShown: false }} />
    </Stack>
  );
}
