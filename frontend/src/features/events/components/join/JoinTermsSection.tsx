import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

import { Feather } from "@expo/vector-icons";

import { Checkbox } from "@/src/components/ui/Checkbox";

interface JoinTermsSectionProps {
  /** Whether the terms checkbox is accepted. */
  termsAccepted: boolean;
  /** Toggle callback for terms acceptance. */
  onToggleTerms: () => void;
}

/**
 * Renders the "Terms & Conditions" section for the join event page.
 * Shows a view-terms button and a mandatory acceptance checkbox
 * matching the prev_vol design.
 *
 * @param root0 - Component props.
 * @param root0.termsAccepted - Current acceptance state.
 * @param root0.onToggleTerms - Toggle handler.
 * @returns {JSX.Element} The rendered terms section.
 */
export function JoinTermsSection({
  termsAccepted,
  onToggleTerms,
}: JoinTermsSectionProps): React.JSX.Element {
  return (
    <View className="mt-4 px-4 py-3">
      <Text className="pb-4 font-nunito-bold text-lg text-neutral-black">
        Terms &amp; Conditions
      </Text>

      {/* View Terms Button */}
      <TouchableOpacity className="mb-3 flex-row items-center justify-between rounded-md border border-primary px-3 py-1">
        <View className="flex-row items-center gap-3 py-2">
          <Feather name="file-text" size={24} color="#01A39F" />
          <Text className="font-nunito-semibold text-sm text-primary">
            Terms &amp; Conditions
          </Text>
        </View>
        <Text className="font-nunito-semibold text-sm text-primary">View</Text>
      </TouchableOpacity>

      {/* Acceptance Checkbox */}
      <View className="mt-2 flex-row items-center">
        <Checkbox isChecked={termsAccepted} onToggle={onToggleTerms} />
        <Text className="ml-2 flex-1 font-nunito text-xs text-neutral-light">
          I have read and agree to the terms &amp; conditions set by the host
        </Text>
      </View>
    </View>
  );
}
