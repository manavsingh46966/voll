import React, {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Platform, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import DateTimePicker from "@react-native-community/datetimepicker";

import { colors } from "@/constants/theme";
import { TabIcon } from "@/src/components/icons/TabIcon";
import { ActionModal } from "@/src/components/ui/ActionModal";

import type { TimeSlot } from "../../types/event.types";

/**
 * Properties expected by the {@link TimeSlotBottomSheet} component.
 */
interface Props {
  /** Optional timeslot data mapping loaded when editing an existing slot. */
  initialData?: TimeSlot | null;
  /**
   * Callback fired when saving the slot is confirmed.
   *
   * @param slot The created or updated timeslot object.
   */
  onSave: (slot: TimeSlot) => void;
  /**
   * Callback fired when a slot deletion is confirmed.
   *
   * @param id The unique ID of the timeslot to delete.
   */
  onDelete: (id: string) => void;
  /** Callback fired when the bottom sheet is closed or dismissed. */
  onClose: () => void;
}

/**
 * TimeSlotBottomSheet renders a bottom sheet interface allowing event creators
 * to configure event timeslots or Shifts.
 * Each timeslot consists of a descriptive name title, start time, and end time.
 * Supports split layouts (onboarding guide explaining details, followed by form input sheet).
 *
 * Uses `forwardRef` to pass sheet control APIs back to parent views.
 */
export const TimeSlotBottomSheet = forwardRef<BottomSheetModal, Props>(
  ({ initialData, onSave, onDelete, onClose }, ref) => {
    const insets = useSafeAreaInsets();
    const safeBottomPadding = Math.max(insets.bottom, 16);
    const snapPoints = useMemo(() => ["85%"], []);

    // State to toggle between the Onboarding screen and the Form
    const [view, setView] = useState<"onboarding" | "form">("onboarding");

    const [title, setTitle] = useState("");
    const [start, setStart] = useState("");
    const [end, setEnd] = useState("");
    const [pickerMode, setPickerMode] = useState<"start" | "end" | null>(null);
    const [alertConfig, setAlertConfig] = useState<{
      title: string;
      message: string;
    } | null>(null);

    // Sync state when opened for adding or editing
    useEffect(() => {
      if (initialData) {
        setView("form"); // Skip onboarding if they are editing an existing slot
        setTitle(initialData.title);
        setStart(initialData.startTime);
        setEnd(initialData.endTime);
      } else {
        setView("onboarding"); // Show onboarding for new slots
        setTitle("");
        setStart("");
        setEnd("");
      }
    }, [initialData]);

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.6}
        />
      ),
      [],
    );

    /**
     * Handles time changes from native OS picker.
     * Updates start or end state based on `pickerMode`.
     *
     * @param {any} _ Event metadata parameter.
     * @param {Date} [selectedDate] The picked date object.
     * @returns {void}
     */
    const handleNativeTimeChange = (_: any, selectedDate?: Date) => {
      if (Platform.OS === "android") setPickerMode(null);
      if (!selectedDate || !pickerMode) return;
      pickerMode === "start"
        ? setStart(selectedDate.toISOString())
        : setEnd(selectedDate.toISOString());
    };

    /**
     * Validates timeslot data, ensuring all parameters are set and end time is strictly after start time.
     * Triggers `onSave` if validation passes, or displays alert overlay if it fails.
     *
     * @returns {void}
     */
    const handleSave = () => {
      if (!title.trim() || !start || !end) {
        return setAlertConfig({
          title: "Missing Fields",
          message: "Please enter a title and select both times.",
        });
      }
      if (new Date(end) <= new Date(start)) {
        return setAlertConfig({
          title: "Invalid Time",
          message: "The end time must be after the start time.",
        });
      }

      onSave({
        id: initialData?.id || Date.now().toString(),
        title: title.trim(),
        startTime: start,
        endTime: end,
        minParticipants: initialData?.minParticipants ?? 0,
        maxParticipants: initialData?.maxParticipants ?? 0,
        skillGroups: initialData?.skillGroups ?? [],
      });
    };

    /**
     * Converts an ISO string into formatted time in 12-hour format.
     *
     * @param {string} iso The ISO-8601 string of target time.
     * @returns {string} The formatted localized time string, or placeholder "Time".
     */
    const formatTime = (iso: string) => {
      if (!iso) return "Time";
      return new Date(iso).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    };

    return (
      <BottomSheetModal
        ref={ref}
        index={0}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ borderRadius: 24 }}
        enablePanDownToClose={false}
      >
        {/* CONDITION 1: THE ONBOARDING VIEW */}
        {view === "onboarding" ? (
          <BottomSheetScrollView
            contentContainerStyle={{
              flexGrow: 1,
              paddingBottom: safeBottomPadding,
            }}
          >
            <View className="flex-1 px-5 pt-2">
              <TouchableOpacity
                accessibilityRole="button"
                onPress={onClose}
                className="mb-6"
              >
                <Ionicons
                  name="arrow-back"
                  size={24}
                  color={colors.neutral.DEFAULT}
                />
              </TouchableOpacity>

              <View className="mb-8 items-center">
                <View className="h-[150px] w-[150px] items-center justify-center rounded-full bg-primary shadow-sm">
                  <TabIcon
                    name="clipboardClockOutline"
                    size={90}
                    color={"white"}
                  />
                </View>
              </View>

              <Text className="mb-4 text-center font-nunito-bold text-[22px] text-primary">
                Time Slots
              </Text>

              <Text className="mb-6 text-center text-justify font-nunito text-[15px] leading-6 text-neutral">
                Creating time slots enables you to create different batches for
                your event. This might help in case you have a large number of
                followers; or if you simply wish to provide your followers the
                option to join at various timings.
              </Text>

              <Text className="font-nunito text-[14px] leading-5 text-neutral">
                <Text className="underline">Note:</Text> A person can
                participate in only one time slot at a time.
              </Text>

              {/* Spacer pushes the button to the absolute bottom */}
              <View className="min-h-[20px] flex-1" />

              <TouchableOpacity
                accessibilityRole="button"
                className="w-full items-center rounded-xl bg-primary py-4"
                onPress={() => setView("form")} // Switches the view instantly!
              >
                <Text className="font-nunito-bold text-[16px] text-white">
                  Create time slots
                </Text>
              </TouchableOpacity>
            </View>
          </BottomSheetScrollView>
        ) : (
          /* CONDITION 2: THE ACTUAL FORM VIEW */
          <BottomSheetScrollView
            contentContainerStyle={{
              flexGrow: 1,
              paddingBottom: safeBottomPadding,
            }}
            keyboardShouldPersistTaps="handled"
          >
            <View className="flex-1 px-5 pt-2">
              <Text className="mb-6 font-nunito-bold text-[18px] text-primary">
                Create time slot
              </Text>

              <Text className="mb-2 font-nunito-bold text-[14px] text-neutral">
                Title
              </Text>
              <BottomSheetTextInput
                className="mb-6 h-12 rounded-xl border border-neutral-lightest px-4 font-nunito text-[15px] text-neutral"
                value={title}
                onChangeText={setTitle}
                placeholder="Name this slot"
                placeholderTextColor={colors.neutral.light}
              />

              <Text className="mb-2 font-nunito-bold text-[14px] text-neutral">
                Set Time
              </Text>
              <View className="mb-8 flex-row items-center gap-x-4">
                <TouchableOpacity
                  accessibilityRole="button"
                  className="h-12 flex-1 items-center justify-center rounded-xl border border-neutral-lightest"
                  onPress={() => setPickerMode("start")}
                >
                  <Text
                    className={`font-nunito text-[14px] ${start ? "text-neutral" : "text-neutral-light"}`}
                  >
                    {formatTime(start)}
                  </Text>
                </TouchableOpacity>
                <Text className="font-nunito text-[14px] text-neutral">to</Text>
                <TouchableOpacity
                  accessibilityRole="button"
                  className="h-12 flex-1 items-center justify-center rounded-xl border border-neutral-lightest"
                  onPress={() => setPickerMode("end")}
                >
                  <Text
                    className={`font-nunito text-[14px] ${end ? "text-neutral" : "text-neutral-light"}`}
                  >
                    {formatTime(end)}
                  </Text>
                </TouchableOpacity>
              </View>

              <View className="mb-4 rounded-xl bg-primary-surface p-3">
                <Text className="font-nunito-semibold text-[13px] text-primary">
                  Slot capacity is calculated from skill groups in Step 3.
                </Text>
              </View>

              {/* Spacer pushes the buttons to the bottom */}
              <View className="min-h-[20px] flex-1" />

              <View className="w-full pt-4">
                <TouchableOpacity
                  accessibilityRole="button"
                  className="mb-3 items-center rounded-xl bg-primary py-4"
                  onPress={handleSave}
                >
                  <Text className="font-nunito-bold text-[16px] text-white">
                    Done
                  </Text>
                </TouchableOpacity>

                {initialData && (
                  <TouchableOpacity
                    accessibilityRole="button"
                    className="mb-3 flex-row items-center justify-center rounded-xl border border-neutral-lightest bg-white py-4"
                    onPress={() => onDelete(initialData.id)}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={18}
                      color={colors.neutral.DEFAULT}
                      className="mr-2"
                    />
                    <Text className="font-nunito-semibold text-[15px] text-neutral">
                      Delete slot
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {pickerMode && Platform.OS !== "web" && (
                <DateTimePicker
                  value={
                    pickerMode === "start" && start
                      ? new Date(start)
                      : pickerMode === "end" && end
                        ? new Date(end)
                        : new Date()
                  }
                  mode="time"
                  display="spinner"
                  onChange={handleNativeTimeChange}
                />
              )}
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              className="items-center border-t border-neutral-lightest py-3"
              onPress={onClose}
            >
              <Text className="font-nunito text-[15px] text-error">Close</Text>
            </TouchableOpacity>
          </BottomSheetScrollView>
        )}

        <ActionModal
          visible={!!alertConfig}
          title={alertConfig?.title || ""}
          message={alertConfig?.message || ""}
          actionLabel="Got it"
          onAction={() => setAlertConfig(null)}
        />
      </BottomSheetModal>
    );
  },
);
