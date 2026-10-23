import React from "react";
import { TouchableOpacity, View } from "react-native";

interface RadioBtnProps {
  /** Whether this radio button is currently selected. */
  isSelected: boolean;
  /** Callback fired when this radio button is pressed. */
  onSelect: () => void;
  /** If true, the radio button is non-interactive and dimmed. */
  disabled?: boolean;
}

/**
 * A circular radio button matching the prev_vol RadioBtn design:
 * 6×6 outer circle with border-2, inner 4×4 filled circle when selected.
 *
 * @param root0 - Component props.
 * @param root0.isSelected - Current selected state.
 * @param root0.onSelect - Selection handler.
 * @param root0.disabled - Disables interaction and dims the button.
 * @returns {JSX.Element} The rendered radio button.
 */
export function RadioBtn({
  isSelected,
  onSelect,
  disabled = false,
}: RadioBtnProps): React.JSX.Element {
  return (
    <TouchableOpacity
      accessibilityRole="radio"
      accessibilityState={{ selected: isSelected, disabled }}
      onPress={onSelect}
      disabled={disabled}
      className={`h-6 w-6 items-center justify-center rounded-full border-2 border-neutral-lightest ${disabled ? "opacity-40" : ""}`}
    >
      <View
        className={`h-4 w-4 rounded-full ${isSelected ? "bg-primary" : "border-2 border-neutral-lightest"}`}
      />
    </TouchableOpacity>
  );
}
