import React from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";

import { Ionicons } from "@expo/vector-icons";

import { colors } from "@/constants/theme";

import type { NotificationFilter } from "../types/notification.types";

interface NotificationEmptyStateProps {
  filter: NotificationFilter;
}

export const NotificationEmptyState: React.FC<NotificationEmptyStateProps> = ({
  filter,
}) => {
  const getEmptyDetails = () => {
    switch (filter) {
      case "unread":
        return {
          icon: "checkmark-circle-outline" as const,
          title: "You're All Caught Up!",
          subtitle: "No unread notifications right now.",
        };
      case "events":
        return {
          icon: "calendar-outline" as const,
          title: "No Event Updates",
          subtitle: "Join volunteering events to get real-time schedule changes and announcements.",
        };
      case "social":
        return {
          icon: "heart-outline" as const,
          title: "No Social Activity",
          subtitle: "Post your volunteer stories or follow fellow volunteers to see likes and comments here.",
        };
      default:
        return {
          icon: "notifications-off-outline" as const,
          title: "No Notifications Yet",
          subtitle: "When you join events, post stories, or connect with volunteers, you'll see alerts here.",
        };
    }
  };

  const { icon, title, subtitle } = getEmptyDetails();

  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <View
        className="mb-4 h-20 w-20 items-center justify-center rounded-3xl bg-teal-50/70"
        style={{
          borderWidth: 1,
          borderColor: colors.primary.DEFAULT + "20",
        }}
      >
        <Ionicons name={icon} size={40} color={colors.primary.DEFAULT} />
      </View>

      <Text className="mb-2 text-center font-nunito-bold text-xl text-neutral-black">
        {title}
      </Text>

      <Text className="mb-6 max-w-xs text-center text-sm leading-5 text-neutral-gray">
        {subtitle}
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Explore Events"
        onPress={() => router.push("/(drawer)/(tabs)/home" as any)}
        className="rounded-xl bg-primary px-6 py-3 shadow-sm active:opacity-90"
      >
        <Text className="font-nunito-bold text-sm text-white">
          Explore Volunteering Events
        </Text>
      </Pressable>
    </View>
  );
};
