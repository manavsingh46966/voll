import React, { useRef } from "react";
import { Alert, ScrollView, Switch, Text, View } from "react-native";

import { BottomSheetModal } from "@gorhom/bottom-sheet";

import { colors } from "@/constants/theme";

import { useCreateEventStore } from "../../stores/createEvent.store";
import { DateTimeRow } from "../datetime/DateTimeRow";
import { TimezoneBottomSheet } from "../datetime/TimezoneBottomSheet";
import { TimeSlotManager } from "../timeslot/TimeSlotManager";

/**
 * Step2DateTime is a wizard step component that collects date, time, and scheduling constraints:
 * - Event Start Date/Time (uses {@link DateTimeRow})
 * - Event End Date/Time (uses {@link DateTimeRow})
 * - Last Date/Time to Join the event (uses {@link DateTimeRow})
 * - Timezone selector (opens bottom sheet {@link TimezoneBottomSheet})
 * - Recurring event status toggle (switch input)
 * - Shift/Timeslot management listing (delegated to {@link TimeSlotManager})
 *
 * @returns {React.JSX.Element} A ScrollView layout containing the date and timezone controls.
 */
export function Step2DateTime() {
  const { formData, updateData } = useCreateEventStore();
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  /**
   * Validates and updates start, end, or registration deadline dates in the store.
   *
   * Validation checks:
   * 1. End date must be on or after start date.
   * 2. Registration deadline (lastDateToJoin) must be on or before the start date.
   * 3. Start date auto-adjusts end date forward if start date is selected to be after the current end date.
   *
   * @param {("startDate" | "endDate" | "lastDateToJoin")} field The form data date field key to update.
   * @param {string} newIso The newly chosen date/time in ISO-8601 string format.
   * @returns {void}
   */
  const handleDateChange = (
    field: "startDate" | "endDate" | "lastDateToJoin",
    newIso: string,
  ) => {
    const newDate = new Date(newIso);

    if (
      field === "endDate" &&
      formData.startDate &&
      newDate < new Date(formData.startDate)
    ) {
      return Alert.alert(
        "Invalid Date",
        "The event end date cannot be before the start date.",
      );
    }
    if (
      field === "lastDateToJoin" &&
      formData.startDate &&
      newDate > new Date(formData.startDate)
    ) {
      return Alert.alert(
        "Invalid Date",
        "The last date to join must be before the event starts.",
      );
    }

    // Auto-push end date if start date passes it
    if (
      field === "startDate" &&
      formData.endDate &&
      newDate > new Date(formData.endDate)
    ) {
      updateData({ startDate: newIso, endDate: newIso });
      return;
    }

    updateData({ [field]: newIso });
  };

  return (
    <ScrollView
      className="flex-1 px-4 pt-4"
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <DateTimeRow
        label="Event start"
        value={formData.startDate}
        onChange={(iso: string) => handleDateChange("startDate", iso)}
        timeZone={formData.timeZone}
        onTimezonePress={() => bottomSheetRef.current?.present()}
      />

      <DateTimeRow
        label="Event end"
        value={formData.endDate}
        onChange={(iso: string) => handleDateChange("endDate", iso)}
      />

      <DateTimeRow
        label="Last date of joining"
        value={formData.lastDateToJoin || ""}
        onChange={(iso: string) => handleDateChange("lastDateToJoin", iso)}
      />

      <View className="mb-4 flex-row items-center border-y border-neutral-lightest py-4">
        <Text className="flex-1 font-nunito text-[15px] text-neutral">
          Recurring event
        </Text>
        <Switch
          trackColor={{
            false: colors.neutral.lightest,
            true: colors.primary.DEFAULT,
          }}
          thumbColor="#fff"
          value={formData.isRecurring}
          onValueChange={(val) => updateData({ isRecurring: val })}
        />
      </View>

      <TimeSlotManager />
      <View className="h-10" />

      <TimezoneBottomSheet
        ref={bottomSheetRef}
        onSelect={(tzObj) => {
          updateData({ timeZone: tzObj });
          bottomSheetRef.current?.dismiss();
        }}
      />
    </ScrollView>
  );
}
