import React from "react";
import { Text, View } from "react-native";

import { AntDesign } from "@expo/vector-icons";

import { RadioBtn } from "@/src/components/ui/RadioBtn";

import type { SkillGroup } from "../../types";

import { ProgressCircle } from "../ProgressCircle";

interface JoinSkillGroupPickerProps {
  /** Available skill groups (may include skillsRequired fallback). */
  skillsGroup: SkillGroup[];
  /** Currently selected skill group ID (or null). */
  selectedGroupId: string | null;
  /** Callback when a skill group is selected/deselected — passes (id, title). */
  onSelectGroup: (id: string, title: string) => void;
  /** Called once to auto-mark skills as checked when no groups exist. */
  onAutoCheck: () => void;
  /** Optional number of slots for each group to show as a hint. */
  slotCountByGroupId?: Map<string, number>;
}

/**
 * Renders the "Skill Groups" section for the join event page.
 * Each group shows a RadioBtn, bordered card with title/capacity,
 * and ProgressCircle. Full groups are dimmed with a FULL badge.
 * When no groups exist, shows "No skill groups available" and
 * auto-checks the skill requirement.
 *
 * @param root0 - Component props.
 * @param root0.skillsGroup - Array of skill groups.
 * @param root0.selectedGroupTitle - Currently selected group title.
 * @param root0.onSelectGroup - Group selection handler.
 * @param root0.onAutoCheck - Called when no groups exist to bypass skill validation.
 * @returns {JSX.Element} The rendered skill group picker section.
 */
export function JoinSkillGroupPicker({
  skillsGroup,
  selectedGroupId,
  onSelectGroup,
  onAutoCheck,
  slotCountByGroupId,
}: JoinSkillGroupPickerProps): React.JSX.Element {
  const hasGroups = skillsGroup.length > 0;

  return (
    <View className="mt-4 p-4">
      <View className="flex-row items-center gap-2">
        <Text className="font-nunito-bold text-lg text-neutral-black">
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
        {hasGroups ? (
          skillsGroup.map((group, index) => {
            const key = group._id ?? group.title ?? String(index);
            return (
              <GroupRow
                key={key}
                group={group}
                isSelected={selectedGroupId === key}
                onSelect={() => onSelectGroup(key, group.title ?? "")}
                slotCount={slotCountByGroupId?.get(key)}
              />
            );
          })
        ) : (
          <NoGroupsFallback onAutoCheck={onAutoCheck} />
        )}
      </View>
    </View>
  );
}

/* ── Private sub-components ────────────────────────── */

interface GroupRowProps {
  group: SkillGroup;
  isSelected: boolean;
  onSelect: () => void;
  slotCount?: number;
}

/**
 * A single skill-group row with radio button and bordered card.
 *
 * @param root0 - Component props.
 * @param root0.group - Skill group data.
 * @param root0.isSelected - Whether this group is selected.
 * @param root0.onSelect - Selection callback.
 * @returns {JSX.Element} The rendered group row.
 */
function GroupRow({
  group,
  isSelected,
  onSelect,
  slotCount,
}: GroupRowProps): React.JSX.Element {
  const currentCount = group.userDetails?.length ?? 0;
  const maxCapacity = group.capacity ?? group.maxGroupMembers ?? 25;
  const isFull = currentCount >= maxCapacity;

  const borderClass = isFull
    ? "border-neutral-lightest bg-surface-gray"
    : "border-neutral-lightest";
  const textClass = isFull ? "text-neutral-light" : "text-neutral-black";
  const subTextClass = isFull ? "text-neutral-light" : "text-neutral-dark";

  return (
    <View className={`flex-row items-center ${isFull ? "opacity-50" : ""}`}>
      <RadioBtn
        isSelected={isSelected}
        onSelect={onSelect}
        disabled={isFull}
      />
      <View className={`ml-4 flex-1 rounded-md border p-4 ${borderClass}`}>
        <View className="flex-row items-center justify-between">
          <View className="flex-col">
            <View className="flex-row items-center gap-2">
              <Text className={`font-nunito-semibold text-sm ${textClass}`}>
                {group.title}
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
            {slotCount !== undefined ? (
              <Text className="font-nunito text-xs text-primary">
                Available in {slotCount} time slot{slotCount !== 1 ? "s" : ""}
              </Text>
            ) : null}
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

interface NoGroupsFallbackProps {
  onAutoCheck: () => void;
}

/**
 * Placeholder when no skill groups are available. Calls onAutoCheck
 * so the form validation allows submission without skill selection.
 *
 * @param root0 - Component props.
 * @param root0.onAutoCheck - Auto-check callback.
 * @returns {JSX.Element} The fallback text.
 */
function NoGroupsFallback({
  onAutoCheck,
}: NoGroupsFallbackProps): React.JSX.Element {
  React.useEffect(() => {
    onAutoCheck();
  }, [onAutoCheck]);

  return (
    <Text className="font-nunito text-sm text-neutral-light">
      No skill groups available for this event.
    </Text>
  );
}
