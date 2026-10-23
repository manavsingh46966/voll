import React from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { router } from "expo-router";

import { colors } from "@/constants/theme";

import { useFollowUser, useUnfollowUser } from "../hooks/useProfile";

interface Props {
  /** The userId of the profile being viewed */
  targetUserId: string;
  /** True if this is the logged-in user viewing their own profile */
  isOwner: boolean;
  /** Whether the logged-in user currently follows this person */
  isFollowing: boolean;
}

/**
 * Smart action button that renders contextually:
 *  - Own profile → "Edit Profile" button
 *  - Other user, not following → "Follow" button
 *  - Other user, following → "Following" button (tap to unfollow)
 * @param root0
 * @param root0.targetUserId
 * @param root0.isOwner
 * @param root0.isFollowing
 */
export function ProfileActionButton({
  targetUserId,
  isOwner,
  isFollowing,
}: Props) {
  const followMutation = useFollowUser(targetUserId);
  const unfollowMutation = useUnfollowUser(targetUserId);

  const isPending = followMutation.isPending || unfollowMutation.isPending;

  if (isOwner) {
    return (
      <View className="mx-4 mt-4">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Edit your profile"
          onPress={() => router.push("/(drawer)/(tabs)/profile/edit")}
          className="items-center rounded-xl py-3"
          style={{ borderWidth: 2, borderColor: colors.primary.DEFAULT }}
        >
          <Text
            className="font-nunito-bold text-sm"
            style={{ color: colors.primary.DEFAULT }}
          >
            Edit Profile
          </Text>
        </Pressable>
      </View>
    );
  }

  if (isFollowing) {
    return (
      <View className="mx-4 mt-4">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Unfollow this user"
          disabled={isPending}
          onPress={() => unfollowMutation.mutate()}
          className="items-center rounded-xl py-3"
          style={{ borderWidth: 2, borderColor: colors.primary.DEFAULT }}
        >
          {isPending ? (
            <ActivityIndicator size="small" color={colors.primary.DEFAULT} />
          ) : (
            <Text
              className="font-nunito-bold text-sm"
              style={{ color: colors.primary.DEFAULT }}
            >
              Following
            </Text>
          )}
        </Pressable>
      </View>
    );
  }

  return (
    <View className="mx-4 mt-4">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Follow this user"
        disabled={isPending}
        onPress={() => followMutation.mutate()}
        className="items-center rounded-xl py-3"
        style={{ backgroundColor: colors.primary.DEFAULT }}
      >
        {isPending ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Text className="font-nunito-bold text-sm text-white">Follow</Text>
        )}
      </Pressable>
    </View>
  );
}
