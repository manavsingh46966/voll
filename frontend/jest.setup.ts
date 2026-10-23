// jest.setup.ts
import "react-native-gesture-handler/jestSetup";

import { Alert } from "react-native";

// --- 1. MOCK EXPO ROUTER ---
// Prevents "useRouter is not mounted" errors
jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn().mockReturnValue(true),
  }),
  useLocalSearchParams: jest.fn().mockReturnValue({}),
  Stack: {
    Screen: jest.fn(() => null),
  },
}));

// --- 2. MOCK SAFE AREA CONTEXT ---
// Prevents UI crashes
jest.mock("react-native-safe-area-context", () => {
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaProvider: jest.fn(({ children }) => children),
    SafeAreaView: jest.fn(({ children }) => children),
    useSafeAreaInsets: jest.fn(() => inset),
  };
});

// --- 3. MOCK GOOGLE SIGN IN (Native Module) ---
// Prevents "NativeModule not found" error
jest.mock("@react-native-google-signin/google-signin", () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn().mockResolvedValue(true),
    signIn: jest.fn().mockResolvedValue({
      data: {
        idToken: "mock-google-id-token",
        user: {
          id: "google-uid-123",
          email: "test@example.com",
          name: "Test User",
        },
      },
    }),
    signOut: jest.fn().mockResolvedValue(null),
  },
  isSuccessResponse: jest.fn().mockReturnValue(true),
}));

// --- 4. MOCK YOUR FIREBASE ADAPTER ---
// This is the most important part. We mock your specific config file.
jest.mock("@/src/config/firebase", () => ({
  // The 'auth' object
  auth: {
    currentUser: {
      uid: "firebase-test-uid",
      email: "test@example.com",
      displayName: "Test User",
      phoneNumber: null,
      getIdToken: jest.fn().mockResolvedValue("mock-firebase-token-123"),
    },
  },
  // The Modular function you recently exported
  getIdToken: jest.fn().mockResolvedValue("mock-firebase-token-123"),

  // Providers
  GoogleProvider: jest.fn(),
  PhoneProvider: jest.fn(),
}));

// --- 5. MOCK NATIVE ALERTS ---
// Allows us to spy on Alert.alert() calls
jest.spyOn(Alert, "alert");
