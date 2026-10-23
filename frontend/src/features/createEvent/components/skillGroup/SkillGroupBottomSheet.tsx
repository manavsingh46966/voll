import React, { forwardRef, useCallback, useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";

import { colors } from "@/constants/theme";
import { TabIcon } from "@/src/components/icons/TabIcon";
import { ActionModal } from "@/src/components/ui/ActionModal";

import type { SkillGroup, TimeSlot } from "../../types/event.types";

/**
 * A standard preset of volunteer skills offered as quick selectable tags.
 */
const PRESET = [
  "Driving",
  "Plantation",
  "Design",
  "Cooking",
  "Medical",
  "Logistics",
  "Teaching",
];

/**
 * Snap points mapping the height coordinates of the Bottom Sheet Modal view container.
 */
const SNAP = ["92%"];

/**
 * Helper to convert and format an ISO date string to a localized Indian 12-hour format time.
 *
 * @param {string} iso The ISO-8601 string of target time.
 * @returns {string} The localized time string (e.g. "10:30 am").
 */
const formatTime = (iso: string) => {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

/**
 * Properties expected by the {@link SkillGroupBottomSheet} component.
 */
interface Props {
  /** The list of timeslots currently configured for the event. */
  slots: TimeSlot[];
  /** Optional preexisting group configuration payload loaded when editing an existing group. */
  initialData?: { slotId: string; group: SkillGroup } | null;
  /**
   * Callback triggered when saving or updates are confirmed.
   *
   * @param slotId The unique ID of the target timeslot the group is assigned to.
   * @param group The complete group configuration object.
   */
  onSave: (slotId: string, group: SkillGroup) => void;
  /**
   * Callback triggered when a group deletion is confirmed.
   *
   * @param slotId The unique ID of the timeslot containing the group.
   * @param groupId The ID of the skill group to remove.
   */
  onDelete: (slotId: string, groupId: string) => void;
  /** Callback fired when the bottom sheet is closed or dismissed. */
  onClose: () => void;
}

/**
 * SkillGroupBottomSheet displays an overlay allowing event creators to define sub-groups of volunteers.
 * Each skill group has a descriptive name, participant limits (min and max capacity), and required skills.
 * It integrates with Expo safe area insets and uses `@gorhom/bottom-sheet` modal overlays.
 *
 * Uses `forwardRef` to pass sheet control APIs back to parent views.
 */
export const SkillGroupBottomSheet = forwardRef<BottomSheetModal, Props>(
  ({ slots, initialData, onSave, onDelete, onClose }, ref) => {
    const insets = useSafeAreaInsets();
    const safePadding = Math.max(insets.bottom, 16);

    const [view, setView] = useState<"onboarding" | "form">("onboarding");
    const [slotId, setSlotId] = useState("");
    const [title, setTitle] = useState("");
    const [min, setMin] = useState(1);
    const [max, setMax] = useState(1);
    const [skills, setSkills] = useState<string[]>([]);
    const [input, setInput] = useState("");
    const [alert, setAlert] = useState<{
      title: string;
      message: string;
    } | null>(null);

    useEffect(() => {
      if (initialData) {
        setView("form");
        setSlotId(initialData.slotId);
        setTitle(initialData.group.title);
        setMin(initialData.group.minParticipants);
        setMax(initialData.group.maxParticipants);
        setSkills(initialData.group.skills);
      } else {
        setView(
          slots.some((s) => (s.skillGroups || []).length > 0)
            ? "form"
            : "onboarding",
        );
        setSlotId(slots[0]?.id || "");
        setTitle("");
        setMin(1);
        setMax(1);
        setSkills([]);
      }
    }, [initialData, slots]);

    /**
     * Renders a dimming overlay backdrop component behind the sheet using {@link BottomSheetBackdrop}.
     *
     * @param {any} props Backdrop component attributes.
     * @returns {React.JSX.Element} A touchable Backdrop backdrop element.
     */
    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          opacity={0.55}
        />
      ),
      [],
    );

    /**
     * Validates input values and propagates updates to the parent callback `onSave`.
     * Checks if a title is set, at least one skill tag is added, and a target timeslot is selected.
     * Shows an alert modal if any validations fail.
     *
     * @returns {void}
     */
    const handleSave = () => {
      if (!title.trim() || skills.length === 0 || (slots.length > 0 && !slotId)) {
        return setAlert({
          title: "Missing Fields",
          message:
            slots.length > 0
              ? "Please provide a title, select a time slot, and add at least one skill."
              : "Please provide a title and select at least one skill.",
        });
      }
      onSave(slotId, {
        id: initialData?.group.id || Date.now().toString(),
        title: title.trim(),
        minParticipants: min,
        maxParticipants: Math.max(max, min),
        skills,
      });
    };

    /**
     * A visually styled helper subcomponent that renders step controls to increment or decrement numbers.
     *
     * @param props Stepper props.
     * @param props.lbl Stepper title label.
     * @param props.val Current number value.
     * @param props.onChange Callback returning modified number.
     * @returns {React.JSX.Element} A horizontal stepper button layout.
     */
    const Stepper = ({
      lbl,
      val,
      onChange,
    }: {
      lbl: string;
      val: number;
      onChange: (v: number) => void;
    }) => (
      <View className="flex-row items-center">
        <Text className="mr-2 font-nunito text-[12px] text-neutral-light">
          {lbl}
        </Text>
        <TouchableOpacity
          accessibilityRole="button"
          className="h-8 w-8 items-center justify-center rounded-l-md border border-r-0 border-neutral-lightest bg-surface-gray"
          onPress={() => onChange(Math.max(0, val - 1))}
        >
          <Ionicons name="remove" size={16} color={colors.primary.DEFAULT} />
        </TouchableOpacity>
        <View className="h-8 min-w-[42px] items-center justify-center border border-neutral-lightest bg-white px-2">
          <Text className="font-nunito text-[13px] text-neutral">{val}</Text>
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          className="h-8 w-8 items-center justify-center rounded-r-md border border-l-0 border-neutral-lightest bg-surface-gray"
          onPress={() => onChange(val + 1)}
        >
          <Ionicons name="add" size={16} color={colors.primary.DEFAULT} />
        </TouchableOpacity>
      </View>
    );

    return (
      <BottomSheetModal
        ref={ref}
        index={0}
        snapPoints={SNAP}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ borderRadius: 24 }}
        enablePanDownToClose={false}
      >
        {view === "onboarding" ? (
          <BottomSheetScrollView
            contentContainerStyle={{ flexGrow: 1, paddingBottom: safePadding }}
          >
            <View className="flex-1 px-5 pt-2">
              <TouchableOpacity
                accessibilityRole="button"
                className="mb-10"
                onPress={onClose}
              >
                <Ionicons
                  name="arrow-back"
                  size={24}
                  color={colors.neutral.DEFAULT}
                />
              </TouchableOpacity>
              <View className="items-center">
                <View className="h-[118px] w-[118px] items-center justify-center rounded-full bg-primary shadow-sm">
                  <TabIcon name="users" size={64} color="white" focused />
                </View>
                <Text className="mt-8 font-nunito-bold text-[22px] text-primary">
                  Skill Groups
                </Text>
                <Text className="mt-5 text-center font-nunito text-[14px] leading-5 text-neutral-light">
                  Skill groups enable you to create groups based on different
                  volunteering work required within the same event.
                </Text>
              </View>
              <View className="min-h-[20px] flex-1" />
              <TouchableOpacity
                accessibilityRole="button"
                className="items-center rounded-xl bg-primary py-4"
                onPress={() => setView("form")}
              >
                <Text className="font-nunito-bold text-[16px] text-white">
                  Create skill group
                </Text>
              </TouchableOpacity>
            </View>
          </BottomSheetScrollView>
        ) : (
          <BottomSheetScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ flexGrow: 1, paddingBottom: safePadding }}
          >
            <View className="flex-1 px-4 pt-4">
              <Text className="mb-6 font-nunito-bold text-[15px] text-primary">
                {initialData ? "Edit skill group" : "Create skill group"}
              </Text>

              {slots.length > 0 && (
                <>
                  <Text className="mb-2 font-nunito-bold text-[14px] text-neutral">
                    Time Slot
                  </Text>
                  <View className="mb-5">
                    {slots.map((s) => (
                      <TouchableOpacity
                        accessibilityRole="button"
                        key={s.id}
                        onPress={() => setSlotId(s.id)}
                        className={`mb-2 rounded-xl border px-3 py-3 ${slotId === s.id ? "border-primary bg-primary-surface" : "border-neutral-lightest bg-white"}`}
                      >
                        <Text className="font-nunito-semibold text-[14px] text-neutral">
                          {s.title}
                        </Text>
                        <Text className="mt-1 font-nunito text-[12px] text-neutral-light">
                          {formatTime(s.startTime)} - {formatTime(s.endTime)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              <Text className="mb-2 font-nunito-bold text-[14px] text-neutral">
                Title
              </Text>
              <BottomSheetTextInput
                className="mb-6 h-12 rounded-xl border border-neutral-lightest px-4 font-nunito text-[15px] text-neutral"
                value={title}
                onChangeText={setTitle}
                placeholder="Name this skill group"
                placeholderTextColor={colors.neutral.light}
              />

              <Text className="mb-4 font-nunito-bold text-[14px] text-neutral">
                Number of group members
              </Text>
              <View className="mb-6 flex-row justify-between">
                <Stepper
                  lbl="Min"
                  val={min}
                  onChange={(v) => setMin(Math.min(v, max))}
                />
                <Stepper
                  lbl="Max"
                  val={max}
                  onChange={(v) => setMax(Math.max(v, min))}
                />
              </View>

              <Text className="mb-3 font-nunito-bold text-[14px] text-neutral">
                Required skills for this group
              </Text>
              <View className="mb-3 flex-row items-center rounded-xl border border-neutral-lightest px-3">
                <Ionicons
                  name="search"
                  size={18}
                  color={colors.neutral.light}
                />
                <BottomSheetTextInput
                  className="ml-2 flex-1 py-3 font-nunito text-[14px] text-neutral"
                  value={input}
                  onChangeText={setInput}
                  onSubmitEditing={() => {
                    if (input.trim() && !skills.includes(input.trim()))
                      setSkills([...skills, input.trim()]);
                    setInput("");
                  }}
                  placeholder="Search for skills"
                  placeholderTextColor={colors.neutral.light}
                  returnKeyType="done"
                />
              </View>

              <Text className="mb-3 font-nunito text-[12px] text-neutral-light">
                Tap on a skill to remove it
              </Text>
              <View className="mb-6 flex-row flex-wrap gap-2">
                {[...new Set([...skills, ...PRESET])].map((s) => {
                  const sel = skills.includes(s);
                  return (
                    <TouchableOpacity
                      accessibilityRole="button"
                      key={s}
                      onPress={() =>
                        setSkills(
                          sel ? skills.filter((i) => i !== s) : [...skills, s],
                        )
                      }
                      className={`rounded-full border px-3 py-1.5 ${sel ? "border-primary bg-primary" : "border-neutral-lightest bg-white"}`}
                    >
                      <Text
                        className={`font-nunito-semibold text-[12px] ${sel ? "text-white" : "text-neutral-light"}`}
                      >
                        {s}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View className="min-h-[20px] flex-1" />
              <TouchableOpacity
                accessibilityRole="button"
                className="items-center rounded-xl bg-primary py-4"
                onPress={handleSave}
              >
                <Text className="font-nunito-bold text-[16px] text-white">
                  Done
                </Text>
              </TouchableOpacity>
              {initialData && (
                <TouchableOpacity
                  accessibilityRole="button"
                  className="mt-3 items-center rounded-xl border border-neutral-lightest py-4"
                  onPress={() =>
                    onDelete(initialData.slotId, initialData.group.id)
                  }
                >
                  <Text className="font-nunito-semibold text-[15px] text-error">
                    Delete skill group
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              className="mt-3 items-center border-t border-neutral-lightest py-3"
              onPress={onClose}
            >
              <Text className="font-nunito text-[15px] text-error">Close</Text>
            </TouchableOpacity>
          </BottomSheetScrollView>
        )}
        <ActionModal
          visible={!!alert}
          title={alert?.title || ""}
          message={alert?.message || ""}
          actionLabel="Got it"
          onAction={() => setAlert(null)}
        />
      </BottomSheetModal>
    );
  },
);
