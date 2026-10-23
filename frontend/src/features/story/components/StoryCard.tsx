import React, { memo, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";

import { colors } from "@/constants/theme";
import { IconWithBadge } from "@/src/components/icons/IconWithBadge";
import { useSessionStore } from "@/src/stores/session.store";

import { StorySummary } from "../types/story.types";
import { formatStoryDate } from "../utils/storyUtils";

interface Props {
  story: StorySummary;
  onPress: () => void;
  onLike?: (storyId: string) => Promise<void>;
  onCommentPress?: () => void;
}

function StoryCardComponent({ story, onPress, onLike, onCommentPress }: Props) {
  const { user } = useSessionStore();
  const [isLiking, setIsLiking] = useState(false);
  const [localIsFollowing, setLocalIsFollowing] = useState(
    story.author.isFollowing ?? false,
  );

  useEffect(() => {
    setLocalIsFollowing(story.author.isFollowing ?? false);
  }, [story.author.isFollowing]);

  const promptAuth = (action: string) => {
    Alert.alert(
      "Join VolStory",
      `Sign up or log in to ${action}, save events, and track your impact.`,
      [
        { text: "Cancel", style: "cancel" },
        // Change "/login" to match your exact Expo Router auth path (e.g., "/(auth)/login")
        { text: "Join Now", onPress: () => router.push("/login") }, 
      ]
    );
  };

  const handleLike = async (e: { stopPropagation?: () => void }) => {
    e.stopPropagation?.();
    if (!user) {
      return promptAuth("like stories");
    }
    if (!onLike || isLiking) return;

    setIsLiking(true);
    try {
      await onLike(story.id);
    } finally {
      setIsLiking(false);
    }
  };

  const handleAuthorPress = (e: { stopPropagation?: () => void }) => {
    e.stopPropagation?.();
    if (story.author.id) {
      router.push(`/(drawer)/(tabs)/profile/${story.author.id}`);
    }
  };

  const shouldShowFollow =
    !!story.author.id &&
    user?.id !== story.author.id && // Use optional chaining for guest safety
    !localIsFollowing;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open story ${story.title || "Untitled Story"}`}
      accessibilityHint="Opens the story detail page"
      onPress={onPress}
    >
      <View className="mx-1 my-2 flex flex-col gap-0 rounded-2xl bg-surface p-5">
        <View className="mb-3 flex-row items-center">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Open ${story.author.name}'s profile`}
            accessibilityHint="Opens this person's profile"
            onPress={handleAuthorPress}
          >
            <Image
              source={
                story.author.profileImageUrl
                  ? { uri: story.author.profileImageUrl }
                  : {
                      uri: `https://ui-avatars.com/api/?background=01A39F&color=fff&size=96&name=${encodeURIComponent(story.author.name || "User")}`,
                    }
              }
              contentFit="cover"
              className="h-12 w-12 rounded-2xl bg-surface-gray"
            />
          </Pressable>
          <View className="ml-3 flex-1">
            <View className="flex-row items-center">
              <Text
                className="flex-1 font-nunito-bold text-big text-neutral"
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {story.title || "Untitled Story"}
              </Text>
            </View>

            <Text className="mt-0.5 text-caption text-neutral-light">
              {story.author.name}{" "}
              <Text className="text-neutral-lightest">|</Text>{" "}
              {formatStoryDate(story.createdAt)}
            </Text>
          </View>
        </View>

        <Text
          className="mb-4 text-body text-neutral-dark"
          numberOfLines={3}
          ellipsizeMode="tail"
        >
          {story.excerpt || "No description available."}
        </Text>

        <View className="mb-3 h-px w-full bg-surface-gray" />

        {story.status === "published" && (
          <View className="flex-row items-center justify-end gap-2">
            
            {/* COMMENT BUTTON */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Open comments for ${story.title || "story"}`}
              accessibilityHint="Opens the comments sheet"
              onPress={(e) => {
                e.stopPropagation();
                onCommentPress?.();
              }}
            >
              <IconWithBadge
                iconName="message"
                count={story.commentCount}
                color={colors.neutral.light}
              />
            </Pressable>

            {/* LIKE BUTTON BAIT */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${story.isLiked ? "Unlike" : "Like"} ${story.title || "story"}`}
              accessibilityHint="Toggles your like on this story"
              onPress={handleLike}
            >
              <IconWithBadge
                iconName="pray"
                count={story.likeCount}
                color={
                  story.isLiked ? colors.primary.DEFAULT : colors.neutral.light
                }
              />
            </Pressable>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const StoryCard = memo(
  StoryCardComponent,
  (prev, next) =>
    prev.story.id === next.story.id &&
    prev.story.title === next.story.title &&
    prev.story.excerpt === next.story.excerpt &&
    prev.story.likeCount === next.story.likeCount &&
    prev.story.commentCount === next.story.commentCount &&
    prev.story.isLiked === next.story.isLiked &&
    prev.story.createdAt === next.story.createdAt &&
    prev.story.author.name === next.story.author.name &&
    prev.story.author.profileImageUrl === next.story.author.profileImageUrl &&
    prev.story.author.isFollowing === next.story.author.isFollowing &&
    prev.onPress === next.onPress &&
    prev.onLike === next.onLike &&
    prev.onCommentPress === next.onCommentPress,
);

export default StoryCard;