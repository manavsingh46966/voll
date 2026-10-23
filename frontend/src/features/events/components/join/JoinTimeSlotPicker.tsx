import React from "react";
import { Text, View } from "react-native";

import { Checkbox } from "@/src/components/ui/Checkbox";

import type { TimeSlot } from "../../types";
import { formatTime } from "../../utils/format";

import { ProgressCircle } from "../ProgressCircle";

interface JoinTimeSlotPickerProps {
  /** Available time slots for the event. */
  timeSlotsGroup: TimeSlot[];
  /** Currently selected slot IDs. */
  selectedSlotIds: string[];
  /** Callback to toggle a slot by its _id. */
  onToggleSlot: (slotId: string) => void;
  /** Optional section header override (default: "Choose a Time Slot"). */
  label?: string;
}

/**
 * Renders the "Choose a Time Slot" section for the join event page.
 * Each slot displays as a split-card with checkbox, time range,
 * title, capacity, and ProgressCircle. Full slots are dimmed with
 * a FULL badge and disabled checkbox.
 *
 * @param root0 - Component props.
 * @param root0.timeSlotsGroup - Array of time slots.
 * @param root0.selectedSlotIds - Currently selected slot IDs.
 * @param root0.onToggleSlot - Slot toggle handler.
 * @returns {JSX.Element} The rendered time slot picker section.
 */
export function JoinTimeSlotPicker({
  timeSlotsGroup,
  selectedSlotIds,
  onToggleSlot,
  label = "Choose a Time Slot",
}: JoinTimeSlotPickerProps): React.JSX.Element {
  return (
    <View className="mt-4 p-4">
      <Text className="font-nunito-bold text-lg text-neutral-black">
        {label}
      </Text>
      <View className="flex-col gap-2 py-4">
        {timeSlotsGroup.map((slot, index) => (
          <SlotRow
            key={slot._id ?? String(index)}
            slot={slot}
            isChecked={selectedSlotIds.includes(slot._id ?? "")}
            onToggle={() => onToggleSlot(slot._id ?? "")}
          />
        ))}
      </View>
    </View>
  );
}

/* ── Private sub-component ─────────────────────────── */

interface SlotRowProps {
  slot: TimeSlot;
  isChecked: boolean;
  onToggle: () => void;
}

/**
 * A single time-slot row with checkbox and split-card layout.
 *
 * @param root0 - Component props.
 * @param root0.slot - Time slot data.
 * @param root0.isChecked - Whether this slot is selected.
 * @param root0.onToggle - Toggle callback.
 * @returns {JSX.Element} The rendered slot row.
 */
function SlotRow({
  slot,
  isChecked,
  onToggle,
}: SlotRowProps): React.JSX.Element {
  const currentCount = slot.userDetails?.length ?? 0;
  const maxCapacity = slot.maxSlotMembers ?? slot.capacity ?? 25;
  const isFull = currentCount >= maxCapacity;

  const borderClass = isFull
    ? "border-neutral-lightest bg-surface-gray"
    : "border-neutral-lightest";
  const textClass = isFull ? "text-neutral-light" : "text-neutral-black";
  const subTextClass = isFull ? "text-neutral-light" : "text-neutral-dark";

  return (
    <View className={`flex-row items-center ${isFull ? "opacity-50" : ""}`}>
      <Checkbox
        isChecked={isChecked}
        onToggle={onToggle}
        disabled={isFull}
      />
      <View className="flex-1 flex-row items-stretch">
        {/* Left: times */}
        <View
          className={`ml-4 items-center border border-r-0 p-4 ${borderClass} rounded-l-md`}
        >
          <Text className={`font-nunito-semibold text-xs ${textClass}`}>
            {formatTime(slot.startTime)}
          </Text>
          <Text className={`font-nunito-semibold text-xs ${textClass}`}>
            to
          </Text>
          <Text className={`font-nunito-semibold text-xs ${textClass}`}>
            {formatTime(slot.endTime)}
          </Text>
        </View>

        {/* Right: details + progress */}
        <View
          className={`flex-1 flex-row items-center justify-between rounded-r-md border p-4 ${borderClass}`}
        >
          <View className="flex-col">
            <View className="flex-row items-center gap-2">
              <Text className={`font-nunito-semibold text-sm ${textClass}`}>
                {slot.title}
              </Text>
              {isFull ? (
                <View className="rounded-full bg-red-100 px-2 py-0.5">
                  <Text className="font-nunito-bold text-[10px] text-red-600">
                    FULL
                  </Text>
                </View>
              ) : null}
            </View>
            <View className="flex-row">
              <Text className="font-nunito text-xs text-neutral-light">
                Capacity:{" "}
              </Text>
              <Text className={`font-nunito-semibold text-xs ${subTextClass}`}>
                {maxCapacity} people
              </Text>
            </View>
          </View>
          <ProgressCircle
            radius={26}
            curr={currentCount}
            total={maxCapacity}
            mode={1}
          />
        </View>
      </View>
    </View>
  );
}
