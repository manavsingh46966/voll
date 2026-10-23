import React from "react";
import { Text, View } from "react-native";

import { AntDesign } from "@expo/vector-icons";

import type { Participant } from "../types/event.types";

/**
 * Formats an ISO time as a short 12-hour time, or an em dash when missing.
 *
 * @param iso - ISO date string, or null/undefined.
 * @returns The formatted time, e.g. "9:30 AM".
 */
const formatSlotTime = (iso?: string | null): string =>
  iso
    ? new Date(iso).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    : "—";

/**
 * Card showing the time slot a joined volunteer registered for.
 *
 * @param props - Component props.
 * @param props.registration - The current user's participant record.
 * @returns The "Your Time Slot" card.
 */
export function YourTimeSlot({
  registration,
}: {
  registration: Participant;
}): React.JSX.Element {
  return (
    <View className="mx-4 mt-4">
      <Text className="font-nunito-bold text-lg text-neutral-black">
        Your Time Slot
      </Text>
      <View className="mt-3 flex-row items-center">
        <View className="flex-col items-center rounded-l-md border border-neutral-lightest p-4">
          <Text className="font-nunito-semibold text-sm text-neutral-black">
            {formatSlotTime(registration.slotStartTime)}
          </Text>
          <Text className="font-nunito text-sm text-neutral-black">to</Text>
          <Text className="font-nunito-semibold text-sm text-neutral-black">
            {formatSlotTime(registration.slotEndTime)}
          </Text>
        </View>
        {registration.slotTitle && (
          <View className="grow rounded-r-md border border-neutral-lightest p-4">
            <Text className="font-nunito-semibold text-lg text-neutral-black">
              {registration.slotTitle}
            </Text>
          </View>
        )}
      </View>
      <View className="mt-2 flex-row gap-2 pb-3">
        <AntDesign name="info-circle" size={15} color="#01A39F" />
        <Text className="text-sm text-neutral-light">
          To change your time slot, leave the event and rejoin with your
          preferred slot selected.
        </Text>
      </View>
    </View>
  );
}
