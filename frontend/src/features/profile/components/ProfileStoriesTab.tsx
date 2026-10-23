import React from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Href, router } from "expo-router";

import { Ionicons } from "@expo/vector-icons";

import { colors } from "@/constants/theme";
import { useStoryFeed } from "@/src/features/story/hooks/useStoryFeed";
import type { StorySummary } from "@/src/features/story/types/story.types";

interface Props {
  authorId?: string;
  isOwner?: boolean;
}

export function ProfileStoriesTab({ authorId = "me", isOwner = true }: Props) {
  const { stories, isLoading, error, loadStories } = useStoryFeed(authorId);

  if (isLoading) {
    return (
      <View className="items-center justify-center py-12">
        <ActivityIndicator size="small" color={colors.primary.DEFAULT} />
        <Text className="mt-3 font-nunito text-xs text-neutral-light">
          Loading stories...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="items-center justify-center px-6 py-10">
        <Text className="text-center font-nunito text-sm text-neutral-light">
          {error}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => loadStories()}
          className="mt-3 rounded-xl bg-primary/10 px-4 py-2"
        >
          <Text className="font-nunito-bold text-xs text-primary">Retry</Text>
        </Pressable>
      </View>
    );
  }

  if (stories.length === 0) {
    return (
      <View className="items-center justify-center px-6 py-12">
        <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl bg-amber-50">
          <Ionicons name="book-outline" size={32} color="#D97706" />
        </View>
        <Text className="font-nunito-bold text-base text-neutral-black">
          {isOwner ? "No Stories Yet" : "No Stories Published"}
        </Text>
        <Text className="mt-1 text-center font-nunito text-xs text-neutral-light">
          {isOwner
            ? "Share your inspiring volunteering stories with the community!"
            : "This user hasn't published any stories yet."}
        </Text>

        {isOwner && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Write a Story"
            onPress={() => router.push("/(drawer)/(tabs)/stories" as unknown as Href)}
            className="mt-5 flex-row items-center rounded-xl bg-primary px-5 py-3 shadow-sm"
          >
            <Ionicons name="create-outline" size={18} color="white" />
            <Text className="ml-2 font-nunito-bold text-sm text-white">
              Explore & Create Story
            </Text>
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <View className="px-4 pt-3">
      {stories.map((story: StorySummary) => (
        <Pressable
          key={story.id}
          accessibilityRole="button"
          accessibilityLabel={`Story: ${story.title}`}
          onPress={() =>
            router.push(`/(drawer)/(tabs)/stories/${story.id}` as unknown as Href)
          }
          className="mb-3 overflow-hidden rounded-2xl border border-neutral-lightest bg-white p-3.5 shadow-sm active:opacity-95"
        >
          <View className="flex-row">
            {/* Story Thumbnail */}
            <View className="mr-3 h-20 w-20 overflow-hidden rounded-xl bg-neutral-lightest">
              {story.bannerImageUrl ? (
                <Image
                  source={{ uri: story.bannerImageUrl }}
                  contentFit="cover"
                  className="h-full w-full"
                />
              ) : (
                <View className="h-full w-full items-center justify-center bg-amber-50">
                  <Ionicons name="document-text" size={24} color="#D97706" />
                </View>
              )}
            </View>

            {/* Story Info */}
            <View className="flex-1 justify-between">
              <View>
                <Text
                  className="font-nunito-bold text-sm text-neutral-black"
                  numberOfLines={2}
                >
                  {story.title}
                </Text>
              </View>

              <View className="mt-2 flex-row items-center justify-between">
                <View className="flex-row items-center space-x-3">
                  <View className="flex-row items-center">
                    <Ionicons
                      name={story.isLiked ? "heart" : "heart-outline"}
                      size={14}
                      color={story.isLiked ? "#EF4444" : "#6B7280"}
                    />
                    <Text className="ml-1 font-nunito text-xs text-neutral-gray">
                      {story.likeCount || 0}
                    </Text>
                  </View>

                  <View className="ml-3 flex-row items-center">
                    <Ionicons
                      name="chatbubble-outline"
                      size={13}
                      color="#6B7280"
                    />
                    <Text className="ml-1 font-nunito text-xs text-neutral-gray">
                      {story.commentCount || 0}
                    </Text>
                  </View>
                </View>

                {story.createdAt && (
                  <Text className="font-nunito text-xs text-neutral-light">
                    {new Date(story.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </Text>
                )}
              </View>
            </View>
          </View>
        </Pressable>
      ))}
    </View>
  );
}
