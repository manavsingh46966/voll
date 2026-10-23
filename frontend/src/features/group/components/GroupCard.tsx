import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Image } from "expo-image";

import { MaterialCommunityIcons } from "@expo/vector-icons";

import { colors } from "@/constants/theme";
import { getGroupPhotoUrl } from "../api/groups.api";
import type { GroupSummary } from "../types/group.types";

interface Props {
  group: GroupSummary;
  onPress: () => void;
  onLongPress?: () => void;
  showDeleteButton?: boolean;
  onDelete?: () => void;
}

export function GroupCard({
  group,
  onPress,
  onLongPress,
  showDeleteButton,
  onDelete,
}: Props) {
  const photoUri = group.hasPhoto ? getGroupPhotoUrl(group.id) : null;

  return (
    <TouchableOpacity
      accessibilityRole="button"
      // 🚨 Figma Match: Flat background, bottom border, no shadows
      className="flex-row items-center border-b border-surface-gray bg-white py-4 active:bg-neutral-lightest"
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      {/* Avatar Section */}
      <View className="mr-4 border-gray-100">
        {photoUri ? (
          <Image
            source={{ uri: photoUri }}
            // 🚨 Fix: Explicit inline styles prevent Web/Android from collapsing to 0x0
            style={{ width: 56, height: 56, borderRadius: 28 }}
            contentFit="cover"
            transition={200}
            // Removed cachePolicy to prevent CORS/Web abort issues
          />
        ) : (
          <View className="h-[56px] w-[56px] items-center justify-center rounded-full bg-primary-surface">
            <MaterialCommunityIcons
              name="account-group"
              size={32}
              color={colors.primary.DEFAULT}
            />
          </View>
        )}
      </View>

      {/* Title Section */}
      <View className="flex-1 justify-center">
        {/* 🚨 Figma Match: Only the title is shown, vertically centered */}
        <Text 
          className="font-nunito-bold text-[17px] text-neutral" 
          numberOfLines={1}
        >
          {group.name}
        </Text>
      </View>

      {/* Delete Button (Visible during Manage mode) */}
      {showDeleteButton && onDelete && (
        <TouchableOpacity
          accessibilityRole="button"
          className="p-2"
          onPress={onDelete}
          hitSlop={12}
        >
          <MaterialCommunityIcons
            name="trash-can-outline"
            size={22}
            color={colors.error}
          />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}