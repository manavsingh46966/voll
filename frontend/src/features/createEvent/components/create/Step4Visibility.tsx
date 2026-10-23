import React, { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";

import { colors } from "@/constants/theme";
import { getGroupsApi } from "@/src/features/group/api/groups.api";
import { useSessionStore } from "@/src/stores/session.store";

import { useCreateEventStore } from "../../stores/createEvent.store";

/**
 * Configuration options specifying available privacy and visibility types for the event.
 * Each option contains UI labels, descriptive values, vector icons, and subtext explanations.
 */
const VISIBILITY_OPTIONS = [
  {
    label: "Public",
    value: "public",
    icon: "earth-outline",
    description: "Anyone can discover and join your event.",
  },
  {
    label: "Followers",
    value: "followers",
    icon: "people-outline",
    description: "Only your followers can see this event.",
  },
  {
    label: "Groups Only",
    value: "groups_only",
    icon: "people-circle-outline",
    description: "Only members of selected groups can join.",
  },
  {
    label: "By Invite",
    value: "byinvite",
    icon: "lock-closed-outline",
    description: "Only invited users can join.",
  },
] as const;

/**
 * Step4Visibility is a wizard step component that gathers privacy, visibility, and supplemental media:
 * - Event Visibility Options (Public, Followers, Groups Only, By Invite selectors)
 * - Group selection constraints (rendered if visibility is "groups_only", listing user's managed groups fetched via React Query {@link getGroupsApi})
 * - Supplemental video/media link attachments (add and list custom URLs)
 *
 * @returns {React.JSX.Element} A ScrollView layout containing visibility controls and media links.
 */
export function Step4Visibility() {
  const { formData, updateData } = useCreateEventStore();
  const { user } = useSessionStore();
  const [linkInput, setLinkInput] = useState("");

  const { data: myGroups, isLoading: loadingGroups } = useQuery({
    queryKey: ["my-groups"],
    queryFn: getGroupsApi,
    enabled: formData.visibility === "groups_only",
  });

  const adminGroups =
    myGroups?.filter(
      (g) =>
        g.author?.id === user?.id ||
        (g as any).admins?.some((a: any) => a.id === user?.id),
    ) || [];

  /**
   * Appends the current `linkInput` value to the store's `videoLinks` array.
   * Prevents adding duplicate links and clears input state.
   *
   * @returns {void}
   */
  const addLink = () => {
    const link = linkInput.trim();
    if (link && !formData.videoLinks.includes(link)) {
      updateData({ videoLinks: [...formData.videoLinks, link] });
    }
    setLinkInput("");
  };

  /**
   * Removes a specified URL link from the store's `videoLinks` list.
   *
   * @param {string} link The URL link to remove.
   * @returns {void}
   */
  const removeLink = (link: string) => {
    updateData({ videoLinks: formData.videoLinks.filter((l) => l !== link) });
  };

  /**
   * Toggles the selection status of a target group ID.
   * Adds the group ID to `allowedGroups` if absent, or filters it out if already selected.
   * This is used when the event visibility is set to "groups_only".
   *
   * @param {string} groupId The ID of the group to select or deselect.
   * @returns {void}
   */
  const toggleGroupSelection = (groupId: string) => {
    const isSelected = formData.allowedGroups.includes(groupId);
    if (isSelected) {
      updateData({
        allowedGroups: formData.allowedGroups.filter((id) => id !== groupId),
      });
    } else {
      updateData({ allowedGroups: [...formData.allowedGroups, groupId] });
    }
  };

  return (
    <ScrollView
      className="flex-1 px-4 pt-4"
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
      <Text className="mb-3 font-nunito-semibold text-[16px] text-neutral">
        Event Visibility *
      </Text>

      {VISIBILITY_OPTIONS.map((opt) => {
        const selected = formData.visibility === opt.value;
        return (
          <TouchableOpacity
            accessibilityRole="button"
            key={opt.value}
            className={`mb-3 flex-row items-center rounded-xl border px-4 py-3 ${selected ? "border-primary bg-primary-surface" : "border-neutral-lightest bg-white"}`}
            onPress={() => updateData({ visibility: opt.value })}
            activeOpacity={0.8}
          >
            <View
              className={`mr-3 h-10 w-10 items-center justify-center rounded-full ${selected ? "bg-primary" : "bg-neutral-lightest"}`}
            >
              <Ionicons
                name={opt.icon as any}
                size={20}
                color={selected ? "white" : colors.neutral.light}
              />
            </View>
            <View className="flex-1">
              <Text
                className={`font-nunito-semibold text-[15px] ${selected ? "text-primary" : "text-neutral"}`}
              >
                {opt.label}
              </Text>
              <Text className="mt-0.5 font-nunito text-[12px] text-neutral-light">
                {opt.description}
              </Text>
            </View>
            <View
              className={`h-5 w-5 items-center justify-center rounded-full border-2 ${selected ? "border-primary" : "border-neutral-light"}`}
            >
              {selected && (
                <View className="h-2.5 w-2.5 rounded-full bg-primary" />
              )}
            </View>
          </TouchableOpacity>
        );
      })}

      {formData.visibility === "groups_only" && (
        <View className="mb-4 border-l-2 border-primary-surface pl-2">
          <Text className="mb-2 mt-1 font-nunito-semibold text-[15px] text-neutral">
            Select Groups *
          </Text>
          <Text className="mb-3 font-nunito text-[13px] text-neutral-light">
            Choose the groups that can access this event. You must be an admin
            of the group.
          </Text>

          {loadingGroups ? (
            <ActivityIndicator
              color={colors.primary.DEFAULT}
              className="py-4"
            />
          ) : adminGroups.length === 0 ? (
            <Text className="font-nunito text-[14px] text-error">
              You are not an admin of any groups yet.
            </Text>
          ) : (
            adminGroups.map((group) => {
              const isSelected = formData.allowedGroups.includes(group.id);
              return (
                <TouchableOpacity
                  accessibilityRole="button"
                  key={group.id}
                  className="flex-row items-center py-2"
                  onPress={() => toggleGroupSelection(group.id)}
                >
                  <View
                    className={`mr-3 h-5 w-5 flex-row items-center justify-center rounded border ${isSelected ? "border-primary bg-primary" : "border-neutral-light"}`}
                  >
                    {isSelected && (
                      <Ionicons name="checkmark" size={14} color="white" />
                    )}
                  </View>
                  <Text className="flex-1 font-nunito-semibold text-[14px] text-neutral">
                    {group.name}
                  </Text>
                  <Text className="font-nunito text-[12px] text-neutral-light">
                    {group.memberCount} members
                  </Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      )}

      <View className="mb-4 mt-2 border-t border-neutral-lightest pt-4">
        <View className="mb-3 flex-row items-center">
          <Text className="flex-1 font-nunito-semibold text-[16px] text-neutral">
            Media Links
          </Text>
          <Text className="font-nunito text-[13px] text-neutral-light">
            (optional)
          </Text>
        </View>
        <Text className="mb-3 font-nunito text-[13px] text-neutral-light">
          Link photos, videos, or documents related to your event.
        </Text>
        <View className="mb-3 flex-row items-center gap-x-2">
          <View className="flex-1 flex-row items-center gap-x-2 rounded-xl border border-neutral-lightest px-3 py-2">
            <Ionicons
              name="link-outline"
              size={18}
              color={colors.neutral.light}
            />
            <TextInput
              accessibilityLabel="Text input field"
              className="flex-1 font-nunito text-[14px] text-neutral"
              value={linkInput}
              onChangeText={setLinkInput}
              onSubmitEditing={addLink}
              placeholder="Paste a link..."
              placeholderTextColor={colors.neutral.light}
              autoCapitalize="none"
              keyboardType="url"
              returnKeyType="done"
            />
          </View>
          <TouchableOpacity accessibilityRole="button" onPress={addLink}>
            <MaterialIcons
              name="add-circle"
              size={32}
              color={colors.primary.DEFAULT}
            />
          </TouchableOpacity>
        </View>
        {formData.videoLinks.map((link, index) => (
          <View
            key={index}
            className="mb-2 flex-row items-center rounded-xl border border-neutral-lightest px-3 py-2"
          >
            <Ionicons
              name="link-outline"
              size={16}
              color={colors.primary.DEFAULT}
              className="mr-2"
            />
            <Text
              className="flex-1 font-nunito text-[13px] text-primary"
              numberOfLines={1}
            >
              {link}
            </Text>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => removeLink(link)}
              className="ml-2"
            >
              <Ionicons
                name="close-circle"
                size={20}
                color={colors.neutral.light}
              />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <View className="h-16" />
    </ScrollView>
  );
}
