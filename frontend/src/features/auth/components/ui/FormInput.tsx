import React from "react";
import { Text, TextInput, TextInputProps, View } from "react-native";

interface FormInputProps extends TextInputProps {
  /** The value of the input */
  value: string;
  /** Function to handle text changes */
  onChangeText: (text: string) => void;
  /** Placeholder text */
  placeholder: string;
  /** Error message from Zod/Store (if any) */
  error?: string;
  /** Optional: To handle zIndex for dropdowns overlapping */
  containerStyle?: string;
}

/**
 * **Standard Form Input**
 *
 * A wrapper around React Native's `TextInput` that provides consistent styling
 * and built-in error handling for the application's forms.
 *
 * **Key Features:**
 * - **Validation:** Automatically changes border color to red and displays an error message if the `error` prop is present.
 * - **Styling:** Applies the standard 52px height, rounded corners, and neutral colors.
 * - **Passthrough:** Accepts all standard `TextInput` props (keyboard type, secure text entry, etc.).
 *
 * @component
 * @example
 * <FormInput
 * value={email}
 * onChangeText={setEmail}
 * placeholder="Enter your email"
 * error={errors.email}
 * keyboardType="email-address"
 * />
 *
 * @param {FormInputProps} props - Component properties extending standard TextInput props.
 * @returns {JSX.Element} The styled input field with optional error text.
 */
export const FormInput = ({
  value,
  onChangeText,
  placeholder,
  error,
  containerStyle,
  ...props
}: FormInputProps) => {
  return (
    <View className={containerStyle}>
      <TextInput
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        className={`h-[52px] w-full rounded-lg border bg-white px-4 text-neutral-black ${
          error ? "border-red-500" : "border-neutral-light"
        }`}
        placeholderTextColor="#9CA3AF"
        {...props}
      />
      {error && <Text className="ml-1 mt-1 text-xs text-red-500">{error}</Text>}
    </View>
  );
};
