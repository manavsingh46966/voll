import React, { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, Stack, useLocalSearchParams } from "expo-router";

import { ActionModal } from "@/src/components/ui/ActionModal";
// --- Architecture Imports ---
import { Button } from "@/src/components/ui/Button";
import { OtpInput } from "@/src/features/auth/components/ui/OtpInput";
import { useAuthStore } from "@/src/features/auth/stores/auth.store";

import { usePhoneAuth } from "../hooks/usePhoneAuth";

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type OtpScreenParams = {
  /** The phone number passed from the previous screen for display/resend */
  phone: string;
};

/**
 * **OTP Verification Screen**
 *
 * Handles the second step of Phone Authentication (OTP Entry).
 * It validates the user's input against the code sent via SMS.
 *
 * **Key Features:**
 * - **Auto-Submit:** Automatically triggers verification when 6 digits are entered.
 * - **Conflict Management:** Detects if the phone number is already taken (`accountConflict`) and prompts for login.
 * - **Spam Protection:** Enforces a 30-second countdown timer before allowing a resend.
 *
 * @component
 * @returns {JSX.Element} The OTP entry UI with timer and conflict modal.
 */
export default function OtpScreen() {
  const [otpCode, setOtpCode] = useState("");

  // Resend Timer State (30 seconds default)
  const [timer, setTimer] = useState(30);

  const { phone } = useLocalSearchParams<OtpScreenParams>();
  const { logout } = useAuthStore();

  const { verifyOTP, sendOTP, loading, accountConflict, setAccountConflict } =
    usePhoneAuth();

  // --- OTP Auto-Submit Logic ---
  useEffect(() => {
    if (otpCode.length === 6) {
      verifyOTP(otpCode);
    }
  }, [otpCode, verifyOTP]);

  // --- Countdown Timer Logic ---
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(
        () => setTimer((prev) => prev - 1),
        1000,
      ) as unknown as NodeJS.Timeout;
    }
    return () => clearInterval(interval);
  }, [timer]);

  /**
   * redirect to login if conflict is confirmed
   */
  const handleConflictRedirect = async () => {
    setAccountConflict(false);
    logout(); // Clear any partial session
    router.replace("/(auth)/login");
  };

  /**
   * Triggers the resend logic via the hook
   */
  const handleResend = async () => {
    if (!phone) return;
    await sendOTP(phone);
    setTimer(30); // Reset timer
  };

  return (
    <SafeAreaView className="flex-1 bg-white px-6">
      <Stack.Screen
        options={{ title: "OTP Verification", headerBackTitle: "Edit" }}
      />

      <View className="mx-auto w-full max-w-md flex-1 pt-8">
        <Text className="mb-2 text-center text-2xl font-bold text-neutral-black">
          Enter OTP
        </Text>
        <Text className="mb-10 text-center text-base text-neutral-gray">
          Sent to {phone || "your number"}
        </Text>

        {/* Input Component */}
        <OtpInput value={otpCode} onChange={setOtpCode} length={6} />

        {/* Verify Button */}
        <Button
          title="Continue"
          onPress={() => verifyOTP(otpCode)}
          loading={loading}
          disabled={otpCode.length < 6 || loading}
        />

        {/* Resend Logic */}
        <View className="mt-6 items-center">
          {timer > 0 ? (
            <Text className="text-sm text-neutral-gray">
              Didn&apos;t receive OTP?{" "}
              <Text className="font-bold text-gray-400">
                Resend in {timer}s
              </Text>
            </Text>
          ) : (
            <TouchableOpacity
              accessibilityRole="button"
              activeOpacity={0.7}
              onPress={handleResend}
              disabled={loading}
            >
              <Text className="text-sm text-neutral-gray">
                Didn&apos;t receive OTP?{" "}
                <Text className="font-bold text-primary">Resend OTP</Text>
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Conflict Modal */}
        <ActionModal
          visible={accountConflict}
          title="Number Already Registered"
          message="This phone number is linked to another account. Would you like to log in with that account?"
          actionLabel="Go to Login"
          onAction={handleConflictRedirect}
          secondaryLabel="Use different number"
          onSecondary={() => {
            setAccountConflict(false);
            setOtpCode("");
            router.back();
          }}
        />
      </View>
    </SafeAreaView>
  );
}
