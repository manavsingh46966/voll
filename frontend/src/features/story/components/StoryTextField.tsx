import React from "react";
import { Text, TextInput, View } from "react-native";

import { colors } from "@/constants/theme";

interface StoryTextFieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  maxLength: number;
  disabled?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
}

/**
 * Renders a labeled story form text input with a character counter.
 *
 * @param root0 - Story text field props.
 * @param root0.label - Visible field label.
 * @param root0.value - Current input value.
 * @param root0.onChangeText - Change handler.
 * @param root0.placeholder - Placeholder copy.
 * @param root0.accessibilityLabel - Accessible input label.
 * @param root0.accessibilityHint - Accessible input hint.
 * @param root0.maxLength - Maximum input length.
 * @param root0.disabled - Whether editing is disabled.
 * @param root0.multiline - Whether the input supports multiple lines.
 * @param root0.numberOfLines - Suggested number of visible lines.
 * @returns The labeled story text field.
 */
export function StoryTextField({
  label,
  value,
  onChangeText,
  placeholder,
  accessibilityLabel,
  accessibilityHint,
  maxLength,
  disabled = false,
  multiline = false,
  numberOfLines,
}: StoryTextFieldProps) {
  return (
    <View className="space-y-2">
      <Text className="font-nunito-semibold text-small text-neutral-dark">
        {label}
      </Text>
      <TextInput
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.neutral.light}
        className="rounded-2xl border border-surface-gray bg-surface px-4 py-3 font-nunito text-body text-neutral"
        editable={!disabled}
        maxLength={maxLength}
        multiline={multiline}
        numberOfLines={numberOfLines}
        textAlignVertical={multiline ? "top" : "auto"}
      />
      <Text className="text-caption text-neutral-gray">
        {value.length}/{maxLength}
      </Text>
    </View>
  );
}
