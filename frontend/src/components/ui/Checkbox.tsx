import React from "react";
import { TouchableOpacity } from "react-native";

import { Feather } from "@expo/vector-icons";

interface CheckboxProps {
  /** Whether the checkbox is currently checked. */
  isChecked: boolean;
  /** Callback fired when the checkbox is toggled. */
  onToggle: () => void;
  /** If true, the checkbox is non-interactive and dimmed. */
  disabled?: boolean;
}

/**
 * A simple square checkbox with a Feather check icon.
 * Matches the prev_vol Checkbox design: 6×6 box, border-2, primary
 * background when checked, white check icon.
 *
 * @param root0 - Component props.
 * @param root0.isChecked - Current checked state.
 * @param root0.onToggle - Toggle handler.
 * @param root0.disabled - Disables interaction and dims the checkbox.
 * @returns {JSX.Element} The rendered checkbox.
 */
export function Checkbox({
  isChecked,
  onToggle,
  disabled = false,
}: CheckboxProps): React.JSX.Element {
  const checkedClasses = isChecked
    ? "bg-primary border-primary"
    : "border-neutral-lightest";

  return (
    <TouchableOpacity
      accessibilityRole="checkbox"
      accessibilityState={{ checked: isChecked, disabled }}
      onPress={onToggle}
      disabled={disabled}
      className={`h-6 w-6 items-center justify-center rounded-sm border-2 ${checkedClasses} ${disabled ? "opacity-40" : ""}`}
    >
      {isChecked ? <Feather name="check" color="#ffffff" size={16} /> : null}
    </TouchableOpacity>
  );
}
