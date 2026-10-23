import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";

import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  useFonts,
} from "@expo-google-fonts/nunito";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { colors } from "@/constants/theme";
import { configureGoogleSignIn } from "@/src/config/google";
import { useSessionStore } from "@/src/stores/session.store";

import "@/global.css";

// 1. Configure Native SDKs immediately (Outside component = Performance Win)
configureGoogleSignIn();
SplashScreen.preventAutoHideAsync();

// Initialize Query Client once
const queryClient = new QueryClient();
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

/**
 * **Root Layout (Entry Point)**
 *
 * This is the top-level component that wraps the entire application.
 * It handles global initializations including:
 * - Font Loading (Nunito).
 * - Authentication State Hydration (checking if user is logged in).
 * - Query Client Setup (TanStack Query).
 * - Splash Screen Management.
 *
 * @component
 * @returns {JSX.Element} The root provider tree and navigation stack.
 */
export default function RootLayout() {
  // --- 1. ALL HOOKS MUST BE AT THE TOP (Unconditional) ---

  // Hook A: Load Fonts
  const [fontsLoaded] = useFonts({
    "Nunito-Regular": Nunito_400Regular,
    "Nunito-SemiBold": Nunito_600SemiBold,
    "Nunito-Bold": Nunito_700Bold,
  });

  // Hook B: Auth Store
  const { hydrate } = useSessionStore();

  // Hook C: Local State
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Hook D: Hydrate Auth on Mount
  useEffect(() => {
    const initAuth = async () => {
      await hydrate();

      // Proactively verify token to trigger background refresh via Axios interceptor if expired.
      try {
        if (useSessionStore.getState().isAuthenticated) {
          const { apiClient } = await import("@/src/lib/axios");
          await apiClient.get("/auth/verify");
        }
      } catch {
        // Interceptor handles the actual logout if the refresh entirely fails.
      }

      setIsAuthReady(true);
    };
    initAuth();
  }, [hydrate]);

  // Hook E: Hide Splash Screen when EVERYTHING is ready
  useEffect(() => {
    if (fontsLoaded && isAuthReady) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isAuthReady]);

  // --- 2. CONDITIONAL RETURNS ---

  // If fonts or auth are not ready, show nothing (Splash screen handles this visually)
  if (!fontsLoaded || !isAuthReady) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
      </View>
    );
  }

  // --- 3. RENDER APP ---
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <BottomSheetModalProvider>
            <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(drawer)" />
              <Stack.Screen name="groups" />
              <Stack.Screen
                name="(modals)"
                options={{
                  presentation: "modal",
                  animation: "slide_from_bottom",
                  headerShown: false,
                }}
              />
            </Stack>
          </BottomSheetModalProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
