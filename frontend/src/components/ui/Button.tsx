import React from "react";
import { ActivityIndicator, Text, TouchableOpacity } from "react-native";

import { colors } from "@/constants/theme";

/**
 * Defines the variants for the button style.
 * - `primary`: Filled teal background (Standard).
 * - `secondary`: Transparent with teal border (Outlined).
 * - `tertiary`: Text only (Ghost).
 */
export type ButtonVariant = "primary" | "secondary" | "tertiary";

export interface ButtonProps {
  /** The text label to display inside the button */
  title: string;
  /** Function to execute on press */
  onPress: () => void;
  /** Visual style variant. Defaults to 'primary' */
  variant?: ButtonVariant;
  /** If true, the button is grayed out and not interactive */
  disabled?: boolean;
  /** If true, shows a spinner instead of text */
  loading?: boolean;
  /** Optional NativeWind classes for overriding layout (margins, widths) */
  className?: string;
}

/**
 * **Standard Action Button**
 *
 * The primary interactive element for the Volstory Design System.
 * It encapsulates layout, coloring, and interaction states to ensure UI consistency.
 *
 * **Key Features:**
 * - **Variants:** Supports `primary` (Solid), `secondary` (Outline), and `tertiary` (Ghost) styles.
 * - **State Management:** Automatically handles visual changes for `disabled` and `loading` states.
 * - **Loading Support:** Replaces the text label with an `ActivityIndicator` when processing.
 *
 * @component
 * @example
 * // Standard Submit Button
 * <Button title="Sign In" onPress={handleLogin} loading={isSubmitting} />
 *
 * // Secondary Cancel Button
 * <Button title="Cancel" variant="secondary" onPress={closeModal} />
 *
 * @param {ButtonProps} props - The configuration props for the button.
 * @returns {JSX.Element} The rendered TouchableOpacity with dynamic styling.
 */
export const Button = ({
  title,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  className = "",
}: ButtonProps) => {
  // Base Layout
  const baseStyles =
    "h-[48px] rounded-lg flex-row items-center justify-center px-6";

  // Style Logic Map
  const variants = {
    primary: disabled
      ? "bg-primary-disabled"
      : "bg-primary active:bg-primary-pressed",

    secondary: disabled
      ? "bg-transparent border border-primary-disabled"
      : "bg-transparent border border-primary active:bg-primary-surface",

    tertiary: disabled
      ? "bg-transparent"
      : "bg-transparent active:bg-primary-surface",
  };

  // Text Color Map
  const textColors = {
    primary: "text-neutral-white",
    secondary: disabled ? "text-primary-disabled" : "text-primary",
    tertiary: disabled ? "text-primary-disabled" : "text-primary",
  };

  return (
    <TouchableOpacity
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === "primary"
              ? colors.neutral.white
              : colors.primary.DEFAULT
          }
        />
      ) : (
        <Text className={`text-lg font-bold ${textColors[variant]}`}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};
