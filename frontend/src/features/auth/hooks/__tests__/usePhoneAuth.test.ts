import { act, renderHook } from "@testing-library/react-native";

// 3. API
import * as authApi from "@/src/features/auth/api/auth.api";
// 5. Auth Store
// We need to control the 'verificationId' state for tests
import { useAuthStore } from "@/src/features/auth/stores/auth.store";
// 2. Phone Provider Utils
import * as phoneProvider from "@/src/features/auth/utils/phone-provider";
// 4. Alert Utils
import * as alertUtils from "@/src/utils/alert";

import { usePhoneAuth } from "../usePhoneAuth";

// --- MOCK DEPENDENCIES ---
// 1. Navigation
const mockReplace = jest.fn();
const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  router: {
    replace: (path: string) => mockReplace(path),
    push: (path: string) => mockPush(path),
  },
}));
jest.mock("@/src/features/auth/utils/phone-provider", () => ({
  initWebRecaptcha: jest.fn(),
  clearWebRecaptcha: jest.fn(),
  sendPhoneOtp: jest.fn(),
  confirmPhoneOtp: jest.fn(),
}));
jest.mock("@/src/features/auth/api/auth.api", () => ({
  signInWithGoogleApi: jest.fn(),
}));
jest.mock("@/src/utils/alert", () => ({
  showAlert: jest.fn(),
}));
const mockSetVerificationId = jest.fn();
const mockLogin = jest.fn();
const mockSetSignupData = jest.fn();

jest.mock("@/src/features/auth/stores/auth.store", () => ({
  useAuthStore: jest.fn(),
}));

describe("usePhoneAuth Hook", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default Store Mock Implementation
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      verificationId: "valid-verification-id", // Assume OTP was sent
      setVerificationId: mockSetVerificationId,
      login: mockLogin,
      setSignupData: mockSetSignupData,
    });

    // Default API Success
    (authApi.signInWithGoogleApi as jest.Mock).mockResolvedValue({
      accessToken: "mock-access",
      refreshToken: "mock-refresh",
    });
  });

  // --- TEST CASE 1: HAPPY PATH ---
  it("verifies OTP, logs in, and navigates to register", async () => {
    const { result } = renderHook(() => usePhoneAuth());

    // Action: Verify OTP
    await act(async () => {
      await result.current.verifyOTP("123456");
    });

    // Expect: Provider called
    expect(phoneProvider.confirmPhoneOtp).toHaveBeenCalledWith(
      "valid-verification-id",
      "123456",
    );

    // Expect: Store updated
    expect(mockLogin).toHaveBeenCalled();

    // Expect: Navigation
    expect(mockReplace).toHaveBeenCalledWith("/(auth)/register");
  });

  // --- TEST CASE 2: THE "RACE CONDITION" FIX (useRef) ---
  it("prevents double submission if verifyOTP is called twice rapidly", async () => {
    // Setup: Make the provider take some time so we can click again
    (phoneProvider.confirmPhoneOtp as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100)),
    );

    const { result } = renderHook(() => usePhoneAuth());

    // Action: Call verifyOTP twice instantly
    await act(async () => {
      const promise1 = result.current.verifyOTP("111111");
      const promise2 = result.current.verifyOTP("111111");
      await Promise.all([promise1, promise2]);
    });

    // Expect: The underlying provider function should be called ONLY ONCE
    expect(phoneProvider.confirmPhoneOtp).toHaveBeenCalledTimes(1);
  });

  // --- TEST CASE 3: THE "ALREADY LINKED" FIX (Error Swallowing) ---
  it("treats 'auth/provider-already-linked' error as a SUCCESS", async () => {
    const { result } = renderHook(() => usePhoneAuth());

    // Setup: Mock Provider to THROW the specific error
    (phoneProvider.confirmPhoneOtp as jest.Mock).mockRejectedValue({
      code: "auth/provider-already-linked",
    });

    // Action: Verify OTP
    await act(async () => {
      await result.current.verifyOTP("123456");
    });

    // Expect: It should NOT show an error alert
    expect(alertUtils.showAlert).not.toHaveBeenCalled();

    // Expect: It SHOULD proceed to login and navigation
    expect(mockLogin).toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith("/(auth)/register");
  });

  // --- TEST CASE 4: REAL ERRORS ---
  it("shows alert for invalid code", async () => {
    const { result } = renderHook(() => usePhoneAuth());

    // Setup: Mock Provider to throw INVALID CODE error
    (phoneProvider.confirmPhoneOtp as jest.Mock).mockRejectedValue({
      code: "auth/invalid-verification-code",
    });

    await act(async () => {
      await result.current.verifyOTP("000000");
    });

    // Expect: Alert shown
    expect(alertUtils.showAlert).toHaveBeenCalledWith(
      "Incorrect Code",
      expect.any(String),
    );

    // Expect: NO login or navigation
    expect(mockLogin).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
