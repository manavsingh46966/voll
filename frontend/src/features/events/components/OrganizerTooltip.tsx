import React from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";

import { ProgressCircle } from "./ProgressCircle";

interface OrganizerTooltipProps {
  visible: boolean;
  registeredCount: number;
  maxVolunteers: number;
  onDismiss: () => void;
}

/**
 * One-time overlay that points organisers at the participants counter.
 *
 * @param props - Component props.
 * @param props.visible - Whether the tooltip is shown.
 * @param props.registeredCount - Number of joined volunteers.
 * @param props.maxVolunteers - Maximum volunteers (0 when unlimited).
 * @param props.onDismiss - Called when the user dismisses the tooltip.
 * @returns The tooltip modal.
 */
export function OrganizerTooltip({
  visible,
  registeredCount,
  maxVolunteers,
  onDismiss,
}: OrganizerTooltipProps): React.JSX.Element {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View className="flex-1 items-end justify-start bg-black/70">
        <View className="mt-[272px] flex-col items-end pr-2">
          {/* Ghost of the ProgressCircle to orient the user */}
          <View className="flex-row items-center px-2 py-1">
            <ProgressCircle
              radius={24}
              curr={registeredCount}
              total={maxVolunteers || 1}
            />
            <Text className="pl-2 text-[12px] text-white">Joined</Text>
          </View>
          {/* Tooltip bubble with upward-pointing tail */}
          <View className="relative mr-9 mt-2 min-w-[180px] rounded-lg bg-white p-3 shadow-lg">
            <View className="absolute -top-1.5 right-10 h-0 w-0 border-b-[6px] border-l-[6px] border-r-[6px] border-b-white border-l-transparent border-r-transparent" />
            <View className="items-end">
              <Text className="mb-3 text-sm text-neutral-black">
                Tap to view participants
              </Text>
              <TouchableOpacity
                onPress={onDismiss}
                accessibilityRole="button"
                accessibilityLabel="Dismiss tooltip"
                accessibilityHint="Hides this tip"
              >
                <Text className="font-nunito-semibold text-sm text-primary">
                  Got it
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
