import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

import { Ionicons } from "@expo/vector-icons";

import { colors } from "@/constants/theme";

interface NotificationHeaderProps {
  unreadCount: number;
  onMarkAllAsRead: () => void;
  isMarkingAllRead: boolean;
}

export const NotificationHeader: React.FC<NotificationHeaderProps> = ({
  unreadCount,
  onMarkAllAsRead,
  isMarkingAllRead,
}) => {
  return (
    <View className="flex-row items-center justify-between px-6 pb-2 pt-4">
      <View className="flex-row items-center">
        <Text className="font-nunito-extrabold text-2xl text-neutral-black">
          Notifications
        </Text>
        {unreadCount > 0 && (
          <View className="ml-2.5 rounded-full bg-primary px-2.5 py-0.5 shadow-sm">
            <Text className="font-nunito-bold text-xs text-white">
              {unreadCount} new
            </Text>
          </View>
        )}
      </View>

      {unreadCount > 0 && (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Mark all notifications as read"
          onPress={onMarkAllAsRead}
          disabled={isMarkingAllRead}
          className="flex-row items-center rounded-xl bg-gray-50 px-3 py-1.5 active:bg-gray-100"
        >
          <Ionicons
            name="checkmark-done"
            size={16}
            color={colors.primary.DEFAULT}
          />
          <Text
            className="ml-1 font-nunito-bold text-xs"
            style={{ color: colors.primary.DEFAULT }}
          >
            {isMarkingAllRead ? "Reading..." : "Read All"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
