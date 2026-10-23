import React from "react";
import { Text, View } from "react-native";

import { AntDesign } from "@expo/vector-icons";

import type { SkillGroup, TimeSlot } from "../types";
import { formatTime } from "../utils/format";

import { ProgressCircle } from "./ProgressCircle";

interface EventSlotsSectionProps {
  timeSlotsGroup?: TimeSlot[];
  skillsGroup?: SkillGroup[];
  /** Flat list of required skill names from the backend (when skillsGroup is absent). */
  skillsRequired?: string[];
}

/**
 * Displays time slot cards and skill group cards matching the prev_vol
 * design. Time slots use a split left/right card layout. Skill groups
 * have bordered cards with capacity and a ProgressCircle.
 *
 * @param root0 - Component props.
 * @param root0.timeSlotsGroup - Array of time slot definitions.
 * @param root0.skillsGroup - Array of skill group definitions.
 * @returns {JSX.Element} The rendered slots and skills section.
 */
export function EventSlotsSection({
  timeSlotsGroup,
  skillsGroup,
  skillsRequired,
}: EventSlotsSectionProps): React.JSX.Element {
  const hasSlots = timeSlotsGroup && timeSlotsGroup.length > 0;
  const hasSkills = skillsGroup && skillsGroup.length > 0;
  const hasSkillsRequired = skillsRequired && skillsRequired.length > 0;

  if (!hasSlots && !hasSkills && !hasSkillsRequired) return <View />;

  return (
    <View>
      {/* Time Slots */}
      {hasSlots ? (
        <View className="mt-4 px-4">
          <Text className="font-nunito-bold text-[18px] text-neutral-black">
            Time Slots
          </Text>
          <View className="flex-col gap-4 py-4">
            {timeSlotsGroup.map((slot) => (
              <TimeSlotCard key={slot._id ?? slot.title} slot={slot} />
            ))}
          </View>
        </View>
      ) : null}

      {/* Thick Divider */}
      <View className="h-[6px] bg-neutral-lightest" />

      {/* Skills section: SkillGroup cards if available, else flat skill pills, else empty note */}
      {hasSkills ? (
        <View className="mt-4 px-4">
          <View className="flex-row items-center gap-2">
            <Text className="font-nunito-bold text-[18px] text-neutral-black">
              Skill Groups
            </Text>
            <AntDesign
              name="info-circle"
              size={20}
              color="#01A39F"
              accessibilityLabel="Skill groups info"
            />
          </View>
          <View className="flex-col gap-4 py-4">
            {skillsGroup.map((group) => (
              <SkillGroupCard
                key={group._id ?? group.title}
                group={group}
              />
            ))}
          </View>
        </View>
      ) : hasSkillsRequired ? (
        <View className="mt-4 px-4">
          <Text className="font-nunito-bold text-[18px] text-neutral-black">
            Skills Required
          </Text>
          <View className="mt-3 flex-row flex-wrap gap-2">
            {skillsRequired.map((skill) => (
              <View
                key={skill}
                className="rounded-full border border-primary px-3 py-1"
              >
                <Text className="font-nunito text-[14px] text-primary">{skill}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <View className="mt-4 px-4">
          <View className="flex-row items-center gap-2">
            <Text className="font-nunito-bold text-[18px] text-neutral-black">
              Skill Groups
            </Text>
            <AntDesign
              name="info-circle"
              size={20}
              color="#01A39F"
              accessibilityLabel="Skill groups info"
            />
          </View>
          <View className="my-4 rounded-md border border-neutral-lightest bg-surface-gray p-4">
            <Text className="text-center font-nunito text-[14px] text-neutral-light">
              No skill groups required for this event.
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

/* ── Sub-components ────────────────────────────────── */

interface TimeSlotCardProps {
  slot: TimeSlot;
}

/**
 * Time slot card matching the prev_vol split-card design:
 * left column with start/to/end times, right column with
 * title, capacity text, and a ProgressCircle.
 *
 * @param root0 - Component props.
 * @param root0.slot - The time slot data.
 * @returns {JSX.Element} The rendered time slot card.
 */
function TimeSlotCard({ slot }: TimeSlotCardProps): React.JSX.Element {
  return (
    <View className="flex-row">
      {/* Left: time column */}
      <View className="items-center rounded-l-md border border-neutral-lightest p-4">
        <Text className="font-nunito-semibold text-[14px] text-neutral-black">
          {formatTime(slot.startTime)}
        </Text>
        <Text className="font-nunito-semibold text-[14px] text-neutral-black">
          to
        </Text>
        <Text className="font-nunito-semibold text-[14px] text-neutral-black">
          {formatTime(slot.endTime)}
        </Text>
      </View>

      {/* Right: details + progress */}
      <View className="flex-1 flex-row items-center justify-between rounded-r-md border border-neutral-lightest p-4">
        <View className="flex-col">
          <Text className="font-nunito-semibold text-[18px] text-neutral-black">
            {slot.title ?? "Untitled Slot"}
          </Text>
          <View className="flex-row">
            <Text className="font-nunito text-[14px] text-neutral-light">
              Capacity:{" "}
            </Text>
            <Text className="font-nunito-semibold text-[14px] text-neutral-dark">
              {slot.maxSlotMembers ?? 0} people
            </Text>
          </View>
        </View>
        <ProgressCircle
          radius={26}
          curr={slot.userDetails?.length ?? 0}
          total={slot.maxSlotMembers ?? 1}
          mode={1}
        />
      </View>
    </View>
  );
}

interface SkillGroupCardProps {
  group: SkillGroup;
}

/**
 * Skill group card matching the prev_vol bordered card design with
 * title, capacity text, and a ProgressCircle.
 *
 * @param root0 - Component props.
 * @param root0.group - The skill group data.
 * @returns {JSX.Element} The rendered skill group card.
 */
function SkillGroupCard({ group }: SkillGroupCardProps): React.JSX.Element {
  return (
    <View className="rounded-md border border-neutral-lightest p-4">
      <View className="flex-row items-center justify-between">
        <View className="flex-col">
          <Text className="font-nunito-semibold text-[18px] text-neutral-black">
            {group.title ?? "Untitled Group"}
          </Text>
          <View className="flex-row">
            <Text className="font-nunito text-[14px] text-neutral-light">
              Capacity:{" "}
            </Text>
            <Text className="font-nunito-semibold text-[14px] text-neutral-dark">
              {group.maxGroupMembers ?? 0} people
            </Text>
          </View>
        </View>
        <ProgressCircle
          radius={26}
          curr={group.userDetails?.length ?? 0}
          total={group.maxGroupMembers ?? 1}
          mode={1}
        />
      </View>
    </View>
  );
}
