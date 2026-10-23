import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";

import { StoryFollowButton } from "@/src/components/ui/StoryFollowButton";
import { useFollowUser, useUnfollowUser } from "@/src/features/profile/hooks/useFollowMutation";
import { useSessionStore } from "@/src/stores/session.store";

import { formatStoryDate } from "../utils/storyUtils";

interface Props {
  name: string;
  createdAt: string;
  eventTimeframe?: string;
  authorId?: string;
  profileImageUrl?: string | null;
  isFollowing?: boolean;
  onFollowStatusChange?: (isFollowing: boolean) => void;
}

/**
 * Renders the story author header with name, timing metadata, and follow button.
 *
 * @param root0 - Author block props.
 * @param root0.name - Story author display name.
 * @param root0.createdAt - Story creation timestamp.
 * @param root0.eventTimeframe - Optional event timeframe label.
 * @param root0.authorId - Author's user ID (required to enable follow button).
 * @param root0.profileImageUrl
 * @param root0.isFollowing - Whether current user is following the author.
 * @param root0.onFollowStatusChange - Callback when follow status changes.
 * @returns The story article author block with follow button.
 */
export function ArticleAuthorBlock({
  name,
  createdAt,
  eventTimeframe,
  authorId,
  profileImageUrl,
  isFollowing = false,
  onFollowStatusChange,
}: Props) {
  const { user } = useSessionStore();
  const [localIsFollowing, setLocalIsFollowing] = useState(isFollowing);
  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();

  useEffect(() => {
    setLocalIsFollowing(isFollowing);
  }, [isFollowing]);

  const handleFollowAction = async (
    action: "follow" | "unfollow"
  ): Promise<void> => {
    if (!user || !authorId) {
      Alert.alert("Error", "Cannot perform this action");
      return;
    }

    try {
      if (action === "follow") {
        await followMutation.mutateAsync(authorId);
        setLocalIsFollowing(true);
      } else {
        await unfollowMutation.mutateAsync(authorId);
        setLocalIsFollowing(false);
      }
      onFollowStatusChange?.(action === "follow");
    } catch (error) {
      console.error(`Failed to ${action}:`, error);
      Alert.alert("Error", `Failed to ${action}. Please try again.`);
    }
  };

  const isLoading = followMutation.isPending || unfollowMutation.isPending;

  return (
    <View className="mb-6 mt-6 flex-row items-center justify-between gap-3">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${name}'s profile`}
        accessibilityHint="Opens this person's profile"
        onPress={() => {
          if (authorId) router.push(`/(drawer)/(tabs)/profile/${authorId}`);
        }}
        className="flex-1 flex-row items-center gap-3"
      >
        <Image
          source={
            profileImageUrl
              ? { uri: profileImageUrl }
              : {
                  uri: `https://ui-avatars.com/api/?background=01A39F&color=fff&size=96&name=${encodeURIComponent(name || "User")}`,
                }
          }
          contentFit="cover"
          className="h-12 w-12 rounded-2xl bg-surface-gray"
        />
        <View className="flex-1">
          <Text className="font-nunito-semibold text-neutral">{name}</Text>
          <Text className="text-small text-neutral-gray">
            {[formatStoryDate(createdAt), eventTimeframe]
              .filter(Boolean)
              .join(", ")}
          </Text>
        </View>
      </Pressable>

      {/* Follow button - only show if user is logged in and this is not their own story */}
      {user && authorId && user.id !== authorId && (
        <View>
          {isLoading ? (
            <ActivityIndicator />
          ) : (
            <StoryFollowButton
              userId={authorId}
              isFollowing={localIsFollowing}
              onPress={handleFollowAction}
              disabled={isLoading}
            />
          )}
        </View>
      )}
    </View>
  );
}
