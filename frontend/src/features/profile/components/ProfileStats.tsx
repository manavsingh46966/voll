import React from "react";
import { Pressable, Text, View } from "react-native";

import { colors } from "@/constants/theme";

interface StatItemProps {
  label: string;
  count: number;
  onPress: () => void;
}

function StatItem({ label, count, onPress }: StatItemProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${count} ${label}. Tap to view.`}
      onPress={onPress}
      className="flex-1 items-center py-3"
    >
      <Text
        className="font-nunito-bold text-2xl"
        style={{ color: colors.primary.DEFAULT }}
      >
        {count}
      </Text>
      <Text className="mt-0.5 text-xs text-neutral-light">{label}</Text>
    </Pressable>
  );
}

interface Props {
  followersCount: number;
  followingCount: number;
  onFollowersPress: () => void;
  onFollowingPress: () => void;
}

/**
 * Horizontal stat bar showing Followers and Following counts.
 * Both are tappable to open the respective list.
 * @param root0
 * @param root0.followersCount
 * @param root0.followingCount
 * @param root0.onFollowersPress
 * @param root0.onFollowingPress
 */
export function ProfileStats({
  followersCount,
  followingCount,
  onFollowersPress,
  onFollowingPress,
}: Props) {
  return (
    <View
      className="mx-4 flex-row rounded-2xl bg-surface"
      style={{ borderWidth: 1, borderColor: colors.neutral.lightest }}
    >
      <StatItem
        label="Followers"
        count={followersCount}
        onPress={onFollowersPress}
      />

      {/* Divider */}
      <View
        className="my-3 w-px"
        style={{ backgroundColor: colors.neutral.lightest }}
      />

      <StatItem
        label="Following"
        count={followingCount}
        onPress={onFollowingPress}
      />
    </View>
  );
}
