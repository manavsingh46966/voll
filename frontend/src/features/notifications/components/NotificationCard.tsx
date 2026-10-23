import React from "react";
import { Image, Pressable, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";

import { Ionicons } from "@expo/vector-icons";

import { colors } from "@/constants/theme";

import type { NotificationItem, NotificationType } from "../types/notification.types";

interface NotificationCardProps {
  notification: NotificationItem;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

/**
 * Format relative time from ISO string
 */
function formatTimeAgo(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

/**
 * Returns icon config based on notification type
 */
function getIconConfig(type: NotificationType): {
  iconName: keyof typeof Ionicons.glyphMap;
  bg: string;
  color: string;
  tag: string;
} {
  switch (type) {
    case "event_join":
      return {
        iconName: "calendar",
        bg: "bg-teal-50",
        color: colors.primary.DEFAULT,
        tag: "Event",
      };
    case "event_announcement":
    case "event_message":
      return {
        iconName: "megaphone",
        bg: "bg-amber-50",
        color: "#D97706",
        tag: "Announcement",
      };
    case "event_update":
    case "event_reminder":
    case "event_approved":
      return {
        iconName: "information-circle",
        bg: "bg-blue-50",
        color: "#2563EB",
        tag: "Update",
      };
    case "event_cancelled":
      return {
        iconName: "close-circle",
        bg: "bg-red-50",
        color: "#DC2626",
        tag: "Cancelled",
      };
    case "story_like":
      return {
        iconName: "heart",
        bg: "bg-rose-50",
        color: "#E11D48",
        tag: "Like",
      };
    case "story_comment":
      return {
        iconName: "chatbubble-ellipses",
        bg: "bg-purple-50",
        color: "#7C3AED",
        tag: "Comment",
      };
    case "user_follow":
      return {
        iconName: "person-add",
        bg: "bg-emerald-50",
        color: "#059669",
        tag: "Follower",
      };
    case "group_invite":
      return {
        iconName: "people",
        bg: "bg-indigo-50",
        color: "#4F46E5",
        tag: "Group",
      };
    default:
      return {
        iconName: "notifications",
        bg: "bg-gray-100",
        color: colors.neutral.gray,
        tag: "Notice",
      };
  }
}

export const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onMarkAsRead,
  onDelete,
}) => {
  const { iconName, bg, color, tag } = getIconConfig(notification.type);
  const timeAgo = formatTimeAgo(notification.createdAt);

  const handleCardPress = () => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }

    // Deep link based on attached data
    if (notification.data.eventId) {
      router.push(`/(drawer)/(tabs)/events/${notification.data.eventId}` as any);
    } else if (notification.data.storyId) {
      router.push(`/(drawer)/(tabs)/stories/${notification.data.storyId}` as any);
    } else if (notification.data.userId) {
      router.push(`/(drawer)/(tabs)/profile/${notification.data.userId}` as any);
    }
  };

  const hasDeepLink = Boolean(
    notification.data.eventId ||
      notification.data.storyId ||
      notification.data.userId,
  );

  return (
    <Pressable
      onPress={handleCardPress}
      className={`mx-4 mb-3 rounded-2xl p-4 transition-all ${
        notification.isRead ? "bg-white" : "bg-teal-50/40"
      }`}
      style={{
        borderWidth: 1,
        borderColor: notification.isRead
          ? colors.neutral.lightest
          : colors.primary.DEFAULT + "30",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
      }}
    >
      <View className="flex-row items-start">
        {/* Type / Avatar Icon */}
        <View className="relative mr-3">
          {notification.sender?.profileImageUrl ? (
            <Image
              source={{ uri: notification.sender.profileImageUrl }}
              className="h-11 w-11 rounded-full bg-gray-100"
            />
          ) : (
            <View
              className={`h-11 w-11 items-center justify-center rounded-2xl ${bg}`}
            >
              <Ionicons name={iconName} size={22} color={color} />
            </View>
          )}

          {/* Unread indicator dot */}
          {!notification.isRead && (
            <View
              className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-primary"
            />
          )}
        </View>

        {/* Text Content */}
        <View className="flex-1 pr-2">
          <View className="mb-1 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Text
                className="font-nunito-bold text-xs uppercase tracking-wider"
                style={{ color }}
              >
                {tag}
              </Text>
              {notification.sender && (
                <Text className="ml-1 text-xs text-neutral-gray">
                  • {notification.sender.name}
                </Text>
              )}
            </View>
            <Text className="text-xs text-neutral-light">{timeAgo}</Text>
          </View>

          <Text
            className={`text-base font-nunito-bold ${
              notification.isRead ? "text-neutral-dark" : "text-neutral-black"
            }`}
          >
            {notification.title}
          </Text>

          <Text
            className="mt-1 text-sm leading-5 text-neutral-gray"
            numberOfLines={3}
          >
            {notification.message}
          </Text>

          {/* Action Row */}
          <View className="mt-3 flex-row items-center justify-between pt-1">
            {hasDeepLink ? (
              <View className="flex-row items-center">
                <Text
                  className="font-nunito-bold text-xs"
                  style={{ color: colors.primary.DEFAULT }}
                >
                  {notification.data.eventId
                    ? "View Event"
                    : notification.data.storyId
                      ? "View Story"
                      : "View Profile"}
                </Text>
                <Ionicons
                  name="arrow-forward"
                  size={12}
                  color={colors.primary.DEFAULT}
                  style={{ marginLeft: 3 }}
                />
              </View>
            ) : (
              <View />
            )}

            <View className="flex-row items-center space-x-3">
              {!notification.isRead && (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Mark as read"
                  onPress={() => onMarkAsRead(notification.id)}
                  className="px-2 py-1"
                >
                  <Text className="text-xs font-medium text-neutral-gray hover:text-primary">
                    Mark as read
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Delete notification"
                onPress={() => onDelete(notification.id)}
                className="p-1"
              >
                <Ionicons name="trash-outline" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
};
