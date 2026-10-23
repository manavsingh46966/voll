import React, { useRef, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModal } from "@gorhom/bottom-sheet";

import { colors } from "@/constants/theme";

import { useCreateEventStore } from "../../stores/createEvent.store";
import type { TimeSlot } from "../../types/event.types";
import { withDerivedSlotCapacity } from "../../utils/capacity";

import { TimeSlotBottomSheet } from "./TimeSlotBottomSheet";

// Helper to format "9am" or "10:30am" exactly like the mockup
/**
 * Formats an ISO-8601 date-time string into a human-readable abbreviated AM/PM format
 * (e.g. "9am" or "10:30pm") aligned with design layouts.
 *
 * @param {string} isoStr The ISO-8601 string of target time.
 * @returns {string} The formatted output time string, or an empty string.
 */
const formatAmPm = (isoStr: string) => {
  if (!isoStr) return "";
  const d = new Date(isoStr);
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "pm" : "am";
  h = h % 12 || 12;
  return m === 0
    ? `${h}${ampm}`
    : `${h}:${m.toString().padStart(2, "0")}${ampm}`;
};

/**
 * TimeSlotManager manages event scheduling shifts/slots.
 * It lists created timeslots, shows their formatted timing bounds and total volunteer capacities,
 * and launches {@link TimeSlotBottomSheet} to let users create new slots or edit existing ones.
 *
 * @returns {React.JSX.Element} A layout containing the timeslots manager header, list, and bottom sheet.
 */
export function TimeSlotManager() {
  const { formData, updateData } = useCreateEventStore();
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  // Track which slot is being edited. Null means "Create New".
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null);

  /**
   * Sets the editing target slot context and presents the timeslot builder bottom sheet overlay.
   * Passing no parameters defaults the modal context to "Create New" mode.
   *
   * @param {TimeSlot} [slot] Optional timeslot configuration payload.
   * @returns {void}
   */
  const handleOpenSheet = (slot?: TimeSlot) => {
    setEditingSlot(slot || null);
    bottomSheetRef.current?.present();
  };

  /**
   * Upserts the given timeslot to the global store list.
   * Calculates derived maximum and minimum limits for the slot by mapping `withDerivedSlotCapacity`,
   * checks if a slot with matching ID exists, replaces or appends, updates store state,
   * and dismisses the bottom sheet modal.
   *
   * @param {TimeSlot} savedSlot The timeslot payload configured inside the bottom sheet.
   * @returns {void}
   */
  const handleSaveSlot = (savedSlot: TimeSlot) => {
    const normalizedSlot = withDerivedSlotCapacity(savedSlot);
    const exists = formData.slots.some((s) => s.id === normalizedSlot.id);
    const newSlots = exists
      ? formData.slots.map((s) =>
          s.id === normalizedSlot.id ? normalizedSlot : s,
        )
      : [...formData.slots, normalizedSlot];

    updateData({ slots: newSlots });
    bottomSheetRef.current?.dismiss();
  };

  /**
   * Deletes a timeslot configuration by its ID from the global store array and dismisses the bottom sheet.
   *
   * @param {string} id The unique ID of the target timeslot to remove.
   * @returns {void}
   */
  const handleDeleteSlot = (id: string) => {
    updateData({ slots: formData.slots.filter((s) => s.id !== id) });
    bottomSheetRef.current?.dismiss();
  };

  return (
    <View className="mb-4">
      <View className="mb-4 flex-row items-center">
        <Text className="font-nunito-bold text-[16px] text-neutral">
          Time slots
        </Text>
        <Text className="ml-1 font-nunito text-[14px] text-neutral-light">
          (optional)
        </Text>
        <Ionicons
          name="information-circle-outline"
          size={18}
          color={colors.primary.DEFAULT}
          className="ml-1"
        />
        <View className="flex-1" />
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => handleOpenSheet()}
        >
          <Text className="font-nunito-semibold text-[15px] text-primary">
            Add
          </Text>
        </TouchableOpacity>
      </View>

      {/* Maps directly to Image 2 Layout */}
      {formData.slots.map((slot) => (
        <View
          key={slot.id}
          className="mb-3 flex-row overflow-hidden rounded-xl border border-neutral-lightest bg-white"
        >
          {/* Left Column: Fixed width, right border, stacked times */}
          <View className="w-[80px] items-center justify-center border-r border-neutral-lightest py-3">
            <Text className="text-center font-nunito text-[14px] text-neutral">
              {formatAmPm(slot.startTime)}
              {"\n"}to{"\n"}
              {formatAmPm(slot.endTime)}
            </Text>
          </View>

          {/* Right Column: Details and Edit Action */}
          <View className="flex-1 flex-row items-center justify-between px-4 py-3">
            <View>
              <Text className="font-nunito-bold text-[16px] text-neutral">
                {slot.title}
              </Text>
              <Text className="mt-1 font-nunito text-[14px] text-neutral-light">
                Capacity: {slot.maxParticipants} people
              </Text>
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => handleOpenSheet(slot)}
            >
              <Text className="font-nunito-semibold text-[15px] text-primary">
                Edit
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <TimeSlotBottomSheet
        ref={bottomSheetRef}
        initialData={editingSlot}
        onSave={handleSaveSlot}
        onDelete={handleDeleteSlot}
        onClose={() => bottomSheetRef.current?.dismiss()}
      />
    </View>
  );
}
