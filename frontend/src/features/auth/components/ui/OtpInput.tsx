import React from "react";
import { Text, TextInput, View } from "react-native";

interface OtpInputProps {
  /** The current value of the OTP */
  value: string;
  /** Callback when text changes */
  onChange: (text: string) => void;
  /** Number of digits. @default 6 */
  length?: number;
}

/**
 * **Segmented OTP Input**
 *
 * A specialized input component for capturing One-Time Passwords (OTP).
 * It renders individual visual slots for digits while maintaining a seamless typing experience.
 *
 * **Key Features:**
 * - **Invisible Overlay:** Uses a transparent `TextInput` (opacity-0) covering the entire area to capture native keyboard events (focus, paste, backspace) without complex event handling.
 * - **Visual Logic:** Dynamically highlights the "Active" slot (where the next digit will go) and "Filled" slots using brand colors.
 * - **Flexibility:** Accepts a dynamic length prop to support different OTP formats (4, 6, 8 digits).
 *
 * @component
 * @example
 * <OtpInput
 * value={otpCode}
 * onChange={setOtpCode}
 * length={6}
 * />
 *
 * @param {OtpInputProps} props - Configuration properties.
 * @returns {JSX.Element} A container with visual digit slots and a hidden input handler.
 */
export const OtpInput = ({ value, onChange, length = 6 }: OtpInputProps) => {
  // Create an array based on length to map over
  const slots = Array.from({ length }, (_, i) => i);

  return (
    <View className="relative mb-8 w-full flex-row justify-between">
      {/* Visual Slots */}
      {slots.map((i) => {
        const digit = value[i];
        const isFilled = !!digit;
        const isActive = i === value.length; // Highlight the next slot to type

        return (
          <View
            key={i}
            className={`h-[50px] w-[45px] items-center justify-center rounded-xl border ${
              isFilled || isActive
                ? "border-primary bg-primary-surface" // Active/Filled State
                : "border-neutral-light bg-white" // Empty State
            }`}
          >
            <Text className="text-xl font-bold text-neutral-black">
              {digit || ""}
            </Text>
          </View>
        );
      })}

      {/* Invisible Overlay Input (Captures all touches) */}
      <TextInput
        accessibilityLabel="Text input field"
        accessibilityHint={`Enter the ${length}-digit code`}
        className="absolute h-full w-full opacity-0"
        value={value}
        onChangeText={(text) => {
          // Prevent typing more than length
          if (text.length <= length) onChange(text);
        }}
        keyboardType="number-pad"
        autoFocus
        caretHidden
      />
    </View>
  );
};
