import React, { useMemo, useRef, useState } from "react";
import {
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModal } from "@gorhom/bottom-sheet";

import { colors } from "@/constants/theme";

import { useCreateEventStore } from "../../stores/createEvent.store";
import type { SkillGroup, TimeSlot } from "../../types/event.types";
import {
  deriveEventCapacity,
  withDerivedSlotCapacity,
} from "../../utils/capacity";
import { SkillGroupBottomSheet } from "../skillGroup/SkillGroupBottomSheet";

/**
 * Standard preset skills for quick volunteering role selection.
 */
const PRESET_SKILLS = [
  "Teaching",
  "Driving",
  "Cooking",
  "Medical / First Aid",
  "Design & Media",
  "Logistics & Ops",
  "Plantation & Eco",
  "Photography",
  "Public Speaking",
  "Event Coordination",
  "Fundraising",
  "Child Care",
];

/**
 * Standard perks for participants.
 */
const PRESET_PERKS = [
  "Certificate",
  "Meals",
  "Stipend",
  "Conveyance",
  "Snacks",
  "Water",
];

/**
 * Interactive Number Counter with clickable '-' and '+' controls.
 */
interface CounterProps {
  label: string;
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
}

const InteractiveCounter: React.FC<CounterProps> = ({
  label,
  value,
  onIncrement,
  onDecrement,
}) => (
  <View className="flex-row items-center">
    <Text className="mr-2 font-nunito-semibold text-[13px] text-neutral-light">
      {label}
    </Text>
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`Decrease ${label}`}
      onPress={onDecrement}
      activeOpacity={0.7}
      className="h-9 w-9 items-center justify-center rounded-l-xl border border-r-0 border-neutral-lightest bg-surface-gray active:bg-neutral-lightest"
    >
      <Ionicons name="remove" size={18} color={colors.primary.DEFAULT} />
    </TouchableOpacity>
    <View className="h-9 min-w-[48px] items-center justify-center border border-neutral-lightest bg-white px-2">
      <Text className="font-nunito-bold text-[14px] text-neutral-black">
        {value}
      </Text>
    </View>
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`Increase ${label}`}
      onPress={onIncrement}
      activeOpacity={0.7}
      className="h-9 w-9 items-center justify-center rounded-r-xl border border-l-0 border-neutral-lightest bg-surface-gray active:bg-neutral-lightest"
    >
      <Ionicons name="add" size={18} color={colors.primary.DEFAULT} />
    </TouchableOpacity>
  </View>
);

export function Step3Participation() {
  const { formData, updateData } = useCreateEventStore();
  const sheetRef = useRef<BottomSheetModal>(null);

  const [customSkillInput, setCustomSkillInput] = useState("");
  const [showPerks, setShowPerks] = useState(formData.perks.length > 0);
  const [editing, setEditing] = useState<{
    slotId: string;
    group: SkillGroup;
  } | null>(null);

  const derived = useMemo(() => deriveEventCapacity(formData), [formData]);

  // Current effective values (synced between store and derived)
  const effectiveMin = formData.minParticipants > 0
    ? formData.minParticipants
    : derived.minParticipants;
  const effectiveMax = formData.maxParticipants > 0
    ? formData.maxParticipants
    : derived.maxParticipants;
  const effectiveSkills = [
    ...new Set([...(formData.skills ?? []), ...derived.skills]),
  ];

  /**
   * Handle Min change
   */
  const handleMinChange = (delta: number) => {
    const newMin = Math.max(0, effectiveMin + delta);
    const newMax = Math.max(newMin, effectiveMax);
    updateData({ minParticipants: newMin, maxParticipants: newMax });
  };

  /**
   * Handle Max change
   */
  const handleMaxChange = (delta: number) => {
    const newMax = Math.max(effectiveMin, effectiveMax + delta);
    updateData({ maxParticipants: newMax });
  };

  /**
   * Toggle a required skill
   */
  const handleToggleSkill = (skill: string) => {
    const current = formData.skills ?? [];
    const exists = current.includes(skill);
    const updated = exists
      ? current.filter((s) => s !== skill)
      : [...current, skill];
    updateData({ skills: updated });
  };

  /**
   * Add custom skill from text input
   */
  const handleAddCustomSkill = () => {
    const trimmed = customSkillInput.trim();
    if (!trimmed) return;
    const current = formData.skills ?? [];
    if (!current.includes(trimmed)) {
      updateData({ skills: [...current, trimmed] });
    }
    setCustomSkillInput("");
  };

  /**
   * Remove a skill
   */
  const handleRemoveSkill = (skill: string) => {
    const current = formData.skills ?? [];
    updateData({ skills: current.filter((s) => s !== skill) });
  };

  /**
   * Recalculates slot capacities and event-wide totals, then persists them to the global store.
   */
  const persistSlots = (slots: TimeSlot[]) => {
    const derivedSlots = slots.map(withDerivedSlotCapacity);
    const next = deriveEventCapacity({ ...formData, slots: derivedSlots });
    updateData({
      slots: derivedSlots,
      minParticipants: next.minParticipants,
      maxParticipants: next.maxParticipants,
      skills: [...new Set([...(formData.skills ?? []), ...next.skills])],
    });
  };

  const handleSaveGroup = (slotId: string, group: SkillGroup) => {
    if (formData.slots.length > 0) {
      const slots = formData.slots.map((slot) => {
        const cleanGroups = (slot.skillGroups || []).filter(
          (g) => g.id !== group.id,
        );
        return slot.id === slotId
          ? { ...slot, skillGroups: [...cleanGroups, group] }
          : { ...slot, skillGroups: cleanGroups };
      });
      persistSlots(slots);
    } else {
      // Global skill group
      const cleanGroups = (formData.skillGroups || []).filter(
        (g) => g.id !== group.id,
      );
      const updatedGroups = [...cleanGroups, group];
      updateData({
        skillGroups: updatedGroups,
        minParticipants: Math.max(
          formData.minParticipants,
          group.minParticipants,
        ),
        maxParticipants: Math.max(
          formData.maxParticipants,
          group.maxParticipants,
        ),
        skills: [...new Set([...(formData.skills ?? []), ...group.skills])],
      });
    }
    sheetRef.current?.dismiss();
  };

  const handleDeleteGroup = (slotId: string, groupId: string) => {
    if (formData.slots.length > 0) {
      const slots = formData.slots.map((s) =>
        s.id === slotId
          ? {
              ...s,
              skillGroups: (s.skillGroups || []).filter((g) => g.id !== groupId),
            }
          : s,
      );
      persistSlots(slots);
    } else {
      const cleanGroups = (formData.skillGroups || []).filter(
        (g) => g.id !== groupId,
      );
      updateData({ skillGroups: cleanGroups });
    }
    sheetRef.current?.dismiss();
  };

  return (
    <>
      <ScrollView
        className="flex-1 pt-4"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* NUMBER OF PARTICIPANTS */}
        <View className="border-b border-neutral-lightest px-4 pb-5">
          <Text className="mb-4 font-nunito-bold text-[15px] text-neutral">
            Number of Participants
          </Text>
          <View className="flex-row items-center justify-between">
            <InteractiveCounter
              label="Min"
              value={effectiveMin}
              onIncrement={() => handleMinChange(1)}
              onDecrement={() => handleMinChange(-1)}
            />
            <InteractiveCounter
              label="Max"
              value={effectiveMax}
              onIncrement={() => handleMaxChange(1)}
              onDecrement={() => handleMaxChange(-1)}
            />
          </View>
          <Text className="mt-2.5 font-nunito text-[12px] text-neutral-light">
            Set the minimum and maximum number of volunteers needed.
          </Text>
        </View>

        {/* REQUIRED SKILLS */}
        <View className="border-b border-neutral-lightest px-4 py-5">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="font-nunito-bold text-[15px] text-neutral">
              Required Skills
            </Text>
            {effectiveSkills.length > 0 && (
              <Text className="font-nunito text-xs text-primary">
                {effectiveSkills.length} selected
              </Text>
            )}
          </View>

          {/* Search / Custom Skill Input */}
          <View className="mb-3.5 flex-row items-center rounded-xl border border-neutral-lightest bg-surface-gray px-3">
            <Ionicons name="search" size={18} color={colors.neutral.light} />
            <TextInput
              className="ml-2 flex-1 py-2.5 font-nunito text-[14px] text-neutral-black"
              value={customSkillInput}
              onChangeText={setCustomSkillInput}
              onSubmitEditing={handleAddCustomSkill}
              placeholder="Type a skill and press enter (e.g. Teaching)"
              placeholderTextColor={colors.neutral.light}
              returnKeyType="done"
            />
            {customSkillInput.trim().length > 0 && (
              <TouchableOpacity
                accessibilityRole="button"
                onPress={handleAddCustomSkill}
                className="rounded-lg bg-primary px-3 py-1"
              >
                <Text className="font-nunito-bold text-xs text-white">Add</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Selected Skills Chips */}
          {effectiveSkills.length > 0 && (
            <View className="mb-3">
              <Text className="mb-2 font-nunito-semibold text-xs text-neutral-light">
                Selected Skills (tap to remove):
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {effectiveSkills.map((skill) => (
                  <TouchableOpacity
                    accessibilityRole="button"
                    key={skill}
                    onPress={() => handleRemoveSkill(skill)}
                    className="flex-row items-center rounded-full bg-primary px-3 py-1.5 active:opacity-80"
                  >
                    <Text className="mr-1.5 font-nunito-bold text-[12px] text-white">
                      {skill}
                    </Text>
                    <Ionicons name="close-circle" size={15} color="white" />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Preset Skills Selection */}
          <Text className="mb-2 font-nunito-semibold text-xs text-neutral-light">
            Common Volunteer Skills:
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {PRESET_SKILLS.map((skill) => {
              const isSelected = effectiveSkills.includes(skill);
              return (
                <TouchableOpacity
                  accessibilityRole="button"
                  key={skill}
                  onPress={() => handleToggleSkill(skill)}
                  className={`rounded-full border px-3 py-1.5 ${
                    isSelected
                      ? "border-primary bg-primary"
                      : "border-neutral-lightest bg-white"
                  }`}
                >
                  <Text
                    className={`font-nunito-semibold text-[12px] ${
                      isSelected ? "text-white" : "text-neutral"
                    }`}
                  >
                    {isSelected ? `✓ ${skill}` : `+ ${skill}`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* SKILL GROUPS (OPTIONAL) */}
        <View className="border-b border-neutral-lightest px-4 py-5">
          <View className="mb-3 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Text className="font-nunito-bold text-[15px] text-neutral">
                Skill Groups
              </Text>
              <Text className="ml-1 font-nunito text-[11px] text-neutral-light">
                (optional)
              </Text>
              <Ionicons
                name="information-circle-outline"
                size={16}
                color={colors.primary.DEFAULT}
                style={{ marginLeft: 4 }}
              />
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => {
                setEditing(null);
                sheetRef.current?.present();
              }}
            >
              <Text className="font-nunito-semibold text-[13px] text-primary">
                + Add Group
              </Text>
            </TouchableOpacity>
          </View>

          {formData.slots.length === 0 ? (
            (formData.skillGroups || []).length === 0 ? (
              <View className="rounded-xl border border-dashed border-neutral-lightest p-3">
                <Text className="font-nunito text-[12px] text-neutral-light">
                  Skill groups allow assigning volunteer quotas to specific roles (optional).
                </Text>
              </View>
            ) : (
              formData.skillGroups.map((g) => (
                <View
                  key={g.id}
                  className="mb-2 flex-row items-center justify-between rounded-xl border border-neutral-lightest bg-white p-3 shadow-sm"
                >
                  <View>
                    <Text className="font-nunito-semibold text-[15px] text-neutral">
                      {g.title}
                    </Text>
                    <Text className="mt-1 font-nunito text-[12px] text-neutral-light">
                      Capacity: {g.minParticipants}-{g.maxParticipants} people • Skills: {g.skills.join(", ")}
                    </Text>
                  </View>
                  <TouchableOpacity
                    accessibilityRole="button"
                    onPress={() => {
                      setEditing({ slotId: "", group: g });
                      sheetRef.current?.present();
                    }}
                  >
                    <Text className="font-nunito-semibold text-[13px] text-primary">
                      Edit
                    </Text>
                  </TouchableOpacity>
                </View>
              ))
            )
          ) : (
            formData.slots.map((slot) => (
              <View key={slot.id} className="mb-4">
                <Text className="mb-2 font-nunito-semibold text-[13px] text-neutral-light">
                  {slot.title}
                </Text>
                {(slot.skillGroups || []).length === 0 ? (
                  <View className="rounded-xl border border-dashed border-neutral-lightest p-3">
                    <Text className="font-nunito text-[13px] text-neutral-light">
                      No skill groups assigned to this shift yet.
                    </Text>
                  </View>
                ) : (
                  slot.skillGroups!.map((g) => (
                    <View
                      key={g.id}
                      className="mb-2 flex-row items-center justify-between rounded-xl border border-neutral-lightest bg-white p-3"
                    >
                      <View>
                        <Text className="font-nunito-semibold text-[15px] text-neutral">
                          {g.title}
                        </Text>
                        <Text className="mt-1 font-nunito text-[12px] text-neutral-light">
                          Capacity: {g.minParticipants}-{g.maxParticipants} people
                        </Text>
                      </View>
                      <TouchableOpacity
                        accessibilityRole="button"
                        onPress={() => {
                          setEditing({ slotId: slot.id, group: g });
                          sheetRef.current?.present();
                        }}
                      >
                        <Text className="font-nunito-semibold text-[13px] text-primary">
                          Edit
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </View>
            ))
          )}
        </View>

        {/* PERKS FOR PARTICIPANTS */}
        <View className="border-b border-neutral-lightest px-4 py-5">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Text className="font-nunito-bold text-[15px] text-neutral">
                Perks for participants
              </Text>
              <Text className="ml-1 font-nunito text-[11px] text-neutral-light">
                (optional)
              </Text>
            </View>
            <Switch
              trackColor={{
                false: colors.neutral.lightest,
                true: colors.primary.DEFAULT,
              }}
              thumbColor="#fff"
              value={showPerks}
              onValueChange={setShowPerks}
            />
          </View>
          {showPerks && (
            <View className="mt-3 flex-row flex-wrap gap-2">
              {PRESET_PERKS.map((p) => {
                const sel = formData.perks.includes(p);
                return (
                  <TouchableOpacity
                    accessibilityRole="button"
                    key={p}
                    onPress={() =>
                      updateData({
                        perks: sel
                          ? formData.perks.filter((i) => i !== p)
                          : [...formData.perks, p],
                      })
                    }
                    className={`rounded-full border px-3 py-1.5 ${
                      sel
                        ? "border-primary bg-primary"
                        : "border-neutral-lightest bg-white"
                    }`}
                  >
                    <Text
                      className={`font-nunito-semibold text-[12px] ${
                        sel ? "text-white" : "text-neutral-light"
                      }`}
                    >
                      {p}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* JOIN BY REQUEST */}
        <View className="px-4 pb-10 pt-5">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="font-nunito-bold text-[15px] text-neutral">
                Join by Request
              </Text>
              <Text className="mt-0.5 font-nunito text-xs text-neutral-light">
                Manually approve volunteer requests before they join
              </Text>
            </View>
            <Switch
              trackColor={{
                false: colors.neutral.lightest,
                true: colors.primary.DEFAULT,
              }}
              thumbColor="#fff"
              value={formData.allowJoiningRequests}
              onValueChange={(v) => updateData({ allowJoiningRequests: v })}
            />
          </View>
        </View>
      </ScrollView>

      <SkillGroupBottomSheet
        ref={sheetRef}
        slots={formData.slots}
        initialData={editing}
        onSave={handleSaveGroup}
        onDelete={handleDeleteGroup}
        onClose={() => sheetRef.current?.dismiss()}
      />
    </>
  );
}
