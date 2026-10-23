import { act } from "@testing-library/react-native";

import { useAuthStore } from "@/src/features/auth/stores/auth.store";
import type { User } from "@/src/features/auth/types/domain.types";
import { clientStorage } from "@/src/lib/storage";

// --- 1. MOCK STORAGE ---
// We don't want to use real MMKV storage in tests.
jest.mock("@/src/lib/storage", () => ({
  clientStorage: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
    clearAll: jest.fn(),
  },
}));

// Dummy User Data for testing
const MOCK_USER: User = {
  id: "123",
  userId: "123",
  email: "test@example.com",
  name: "Test User",
  accessToken: "access-token-123",
  refreshToken: "refresh-token-123",
};

describe("Auth Store (Zustand)", () => {
  // RESET STORE BEFORE EACH TEST
  beforeEach(() => {
    jest.clearAllMocks();
    act(() => {
      useAuthStore.setState({
        user: null,
        isAuthenticated: false,
        validationErrors: {},
        registrationData: {
          firstName: "",
          lastName: "",
          age: "",
          gender: "",
          city: "",
          phone: "",
          email: "",
          website: "",
          profileImage: null,
          interests: [],
          skills: [],
        },
      });
    });
  });

  // --- TEST CASE A: LOGIN & PERSISTENCE ---
  it("logs in the user and saves tokens to storage", () => {
    const { login } = useAuthStore.getState();

    act(() => {
      login(MOCK_USER);
    });

    // 1. Check State Update
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.email).toBe("test@example.com");

    // 2. Check Persistence
    expect(clientStorage.setItem).toHaveBeenCalledWith(
      "access_token",
      "access-token-123",
    );
    expect(clientStorage.setItem).toHaveBeenCalledWith(
      "user_data",
      JSON.stringify(MOCK_USER),
    );
  });

  // --- TEST CASE B: LOGOUT ---
  it("logs out and clears storage", () => {
    const { login, logout } = useAuthStore.getState();

    // Setup: Login first
    act(() => login(MOCK_USER));

    // Action: Logout
    act(() => logout());

    // 1. Check State Cleared
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();

    // 2. Check Storage Cleared
    expect(clientStorage.removeItem).toHaveBeenCalledWith("access_token");
    expect(clientStorage.removeItem).toHaveBeenCalledWith("user_data");
  });

  // --- TEST CASE C: THE "DYNAMIC DELETE" FIX ---
  it("updates registration data and removes error for that specific field", () => {
    const { setValidationErrors, setRegistrationData } =
      useAuthStore.getState();

    // Setup: Simulate an error on the "email" field
    act(() => {
      setValidationErrors({
        email: "Invalid email",
        phone: "Phone required", // This one should stay
      });
    });

    // Action: User types into the "email" field
    act(() => {
      setRegistrationData({ email: "new@test.com" });
    });

    const state = useAuthStore.getState();

    // 1. Check Data Update
    expect(state.registrationData.email).toBe("new@test.com");

    // 2. Check Error Logic (The Fix)
    expect(state.validationErrors.email).toBeUndefined();
    expect(state.validationErrors.phone).toBe("Phone required");
  });
});
