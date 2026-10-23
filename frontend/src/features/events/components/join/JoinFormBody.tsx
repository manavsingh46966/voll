import React, { useMemo } from "react";
import { Text, View } from "react-native";

import { AntDesign } from "@expo/vector-icons";

import type { EventItem, SkillGroup } from "../../types";

import { JoinNotesSection } from "./JoinNotesSection";
import { JoinSkillGroupPicker } from "./JoinSkillGroupPicker";
import { JoinTermsSection } from "./JoinTermsSection";
import { JoinTimeSlotPicker } from "./JoinTimeSlotPicker";

interface JoinFormBodyProps {
  event: EventItem;
  selectedSlotIds: string[];
  /** ID of the selected skill group (_id preferred, falls back to title). */
  selectedSkillGroupId: string | null;
  notes: string;
  termsAccepted: boolean;
  onToggleSlot: (id: string) => void;
  onSelectGroup: (id: string, title: string) => void;
  onAutoCheckSkills: () => void;
  onChangeNotes: (text: string) => void;
  onToggleTerms: () => void;
}

/**
 * Body of the join-event form: skill-group and time-slot selection, notes,
 * and terms acceptance. Uses a two-step picker when slots carry nested skill groups.
 *
 * @param props - The event, current selections, and change handlers.
 * @param props.event - The event being joined.
 * @param props.selectedSlotIds - Ids of the currently selected time slots.
 * @param props.selectedSkillGroupId - Id of the selected skill group, or null.
 * @param props.notes - Free-text notes for the organiser.
 * @param props.termsAccepted - Whether the user has accepted the terms.
 * @param props.onToggleSlot - Toggles a time slot by id.
 * @param props.onSelectGroup - Selects a skill group by id and title.
 * @param props.onAutoCheckSkills - Auto-selects skill groups matching the user.
 * @param props.onChangeNotes - Updates the notes text.
 * @param props.onToggleTerms - Toggles terms acceptance.
 * @returns The join form body.
 */
export function JoinFormBody({
  event,
  selectedSlotIds,
  selectedSkillGroupId,
  notes,
  termsAccepted,
  onToggleSlot,
  onSelectGroup,
  onAutoCheckSkills,
  onChangeNotes,
  onToggleTerms,
}: JoinFormBodyProps): React.JSX.Element {
  const slots = useMemo(
    () => event.timeSlotsGroup ?? [],
    [event.timeSlotsGroup],
  );
  const flatSkillGroups = event.skillsGroup ?? [];

  // Hierarchy mode: any slot that carries its own nested skill groups.
  const hasNestedSkillGroups = useMemo(
    () => slots.some((s) => (s.skillGroups ?? []).length > 0),
    [slots],
  );

  // Build a deduplicated skill-group list from all slots.
  const nestedSkillGroups = useMemo<SkillGroup[]>(() => {
    if (!hasNestedSkillGroups) return [];
    const seen = new Map<string, SkillGroup>();
    for (const slot of slots) {
      for (const sg of slot.skillGroups ?? []) {
        const key = sg._id ?? sg.title ?? "";
        if (!seen.has(key)) seen.set(key, sg);
      }
    }
    return [...seen.values()];
  }, [hasNestedSkillGroups, slots]);

  // How many slots each skill group appears in (for the hint text).
  const slotCountByGroupId = useMemo<Map<string, number>>(() => {
    const counts = new Map<string, number>();
    for (const slot of slots) {
      for (const sg of slot.skillGroups ?? []) {
        const key = sg._id ?? sg.title ?? "";
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }
    return counts;
  }, [slots]);

  // Slots filtered to those that contain the selected skill group.
  const filteredSlots = useMemo(() => {
    if (!selectedSkillGroupId) return [];
    return slots.filter((s) =>
      (s.skillGroups ?? []).some(
        (sg) => (sg._id ?? sg.title ?? "") === selectedSkillGroupId,
      ),
    );
  }, [slots, selectedSkillGroupId]);

  // -- Hierarchy mode: slots have nested skill groups ------------------
  if (hasNestedSkillGroups) {
    return (
      <>
        {/* Step 1 — pick a skill group */}
        <JoinSkillGroupPicker
          skillsGroup={nestedSkillGroups}
          selectedGroupId={selectedSkillGroupId}
          onSelectGroup={onSelectGroup}
          onAutoCheck={onAutoCheckSkills}
          slotCountByGroupId={slotCountByGroupId}
        />

        {/* Step 2 — pick a time slot for the chosen skill group */}
        {selectedSkillGroupId !== null && (
          <>
            <View className="h-[6px] bg-neutral-lightest" />
            <View className="mt-4 px-4">
              <View className="mb-3 flex-row items-center gap-2">
                <AntDesign name="check-circle" size={16} color="#01A39F" />
                <Text className="font-nunito text-sm text-neutral-light">
                  Now choose a time slot
                </Text>
              </View>
            </View>
            <JoinTimeSlotPicker
              timeSlotsGroup={filteredSlots}
              selectedSlotIds={selectedSlotIds}
              onToggleSlot={onToggleSlot}
              label="Available Time Slots"
            />
          </>
        )}

        <View className="h-[6px] bg-neutral-lightest" />
        <JoinNotesSection notes={notes} onChangeNotes={onChangeNotes} />
        <View className="h-[6px] bg-neutral-lightest" />
        <JoinTermsSection
          termsAccepted={termsAccepted}
          onToggleTerms={onToggleTerms}
        />
      </>
    );
  }

  // -- Flat mode: skill groups first, then independent slots -----------
  return (
    <>
      {/* Skills first (if any) */}
      {flatSkillGroups.length > 0 && (
        <>
          <JoinSkillGroupPicker
            skillsGroup={flatSkillGroups}
            selectedGroupId={selectedSkillGroupId}
            onSelectGroup={onSelectGroup}
            onAutoCheck={onAutoCheckSkills}
          />
          <View className="h-[6px] bg-neutral-lightest" />
        </>
      )}

      {/* Then slots (if any) */}
      {slots.length > 0 && (
        <>
          <JoinTimeSlotPicker
            timeSlotsGroup={slots}
            selectedSlotIds={selectedSlotIds}
            onToggleSlot={onToggleSlot}
          />
          <View className="h-[6px] bg-neutral-lightest" />
        </>
      )}

      {/* Auto-bypass skill validation when neither section exists */}
      {flatSkillGroups.length === 0 && slots.length === 0 && (
        <AutoBypassSkills onAutoCheck={onAutoCheckSkills} />
      )}

      <JoinNotesSection notes={notes} onChangeNotes={onChangeNotes} />
      <View className="h-[6px] bg-neutral-lightest" />
      <JoinTermsSection
        termsAccepted={termsAccepted}
        onToggleTerms={onToggleTerms}
      />
    </>
  );
}

function AutoBypassSkills({ onAutoCheck }: { onAutoCheck: () => void }) {
  React.useEffect(() => {
    onAutoCheck();
  }, [onAutoCheck]);
  return null;
}
