import React, { useEffect } from "react";
import { Image, StatusBar, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { colors } from "@/constants/theme";
import { useSessionStore } from "@/src/stores/session.store";

/**
 * **Splash Screen (`app/index.tsx`)**
 *
 * The initial entry point of the application.
 * Displays the "VolStory" branding while the app determines the navigation path.
 *
 * **Logic Flow:**
 * 1. Mounts and displays the logo.
 * 2. Waits for a fixed delay (2.5s) for branding purposes.
 * 3. Checks the global `user` authentication state.
 * 4. Routes the user to the Dashboard (if logged in) or Login (if guest).
 *
 * @component
 * @returns {JSX.Element} The rendered splash UI.
 */
export default function SplashScreen() {
  const router = useRouter();
  const { user } = useSessionStore(); // Check if user exists in state

  useEffect(() => {
    // Define logic INSIDE to satisfy linter dependencies
    const checkNavigation = () => {
      if (user) {
        router.replace("/(drawer)/(tabs)/home");
      } else {
        router.replace("/(auth)/login");
      }
    };

    // 1. Artificial Delay for Branding (2.5 seconds)
    const timer = setTimeout(() => {
      checkNavigation();
    }, 2500);

    return () => clearTimeout(timer);
  }, [user, router]);

  return (
    <View className="flex-1 items-center justify-center bg-primary pb-48">
      <StatusBar
        barStyle="light-content"
        backgroundColor={colors.primary.DEFAULT}
      />

      {/* Logo Section */}
      <View className="flex-1 items-center justify-center">
        <Image
          source={require("@/assets/images/logowhite.png")}
          className="mb-8 h-48 w-48"
          resizeMode="contain"
        />
        <Text className="font-nunito-bold text-4xl tracking-wider text-neutral-white">
          VolStory
        </Text>
      </View>
    </View>
  );
}
