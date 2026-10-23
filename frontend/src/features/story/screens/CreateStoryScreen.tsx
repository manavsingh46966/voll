import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";

import { colors } from "@/constants/theme";

import BannerImageField from "../components/BannerImageField";
import { StoryTextField } from "../components/StoryTextField";
import { useStoryActions } from "../hooks/useStoryActions";
import { useStoryStore } from "../stores/storyStore";

/**
 * Renders the create story form.
 *
 * @returns The create story screen.
 */
export default function CreateStoryScreen() {
  const router = useRouter();
  const { createStory, isLoading, error } = useStoryActions();
  const { addStoryToFeed } = useStoryStore();

  const [title, setTitle] = useState("");
  const [bodyMarkdown, setBodyMarkdown] = useState("");
  const [bannerImage, setBannerImage] = useState<{
    previewUrl?: string;
    bannerImageData?: string;
    bannerImageMimeType?: string;
  }>({});
  const [eventTimeframe, setEventTimeframe] = useState("");

  const isValidForm = title.trim().length > 0 && bodyMarkdown.trim().length > 0;

  const handleSubmit = async () => {
    if (!isValidForm) {
      Alert.alert("Validation", "Please fill in title and body.");
      return;
    }

    const result = await createStory({
      title: title.trim(),
      bodyMarkdown: bodyMarkdown.trim(),
      bannerImageData: bannerImage.bannerImageData || undefined,
      bannerImageMimeType: bannerImage.bannerImageMimeType || undefined,
      eventTimeframe: eventTimeframe.trim() || undefined,
    });

    if (result) {
      addStoryToFeed(result);
      Alert.alert("Success", "Story created successfully!");
      router.back();
    } else if (error) {
      Alert.alert("Error", error);
    }
  };

  return (
    <ScrollView className="flex-1 bg-surface">
      <View className="space-y-4 p-4">
        <Text className="font-nunito-bold text-heading text-neutral">
          Create Story
        </Text>

        <StoryTextField
          label="Title *"
          value={title}
          onChangeText={setTitle}
          placeholder="Enter story title"
          accessibilityLabel="Story title"
          accessibilityHint="Enter a short title for your story"
          maxLength={200}
          disabled={isLoading}
        />

        <StoryTextField
          label="Body (Markdown) *"
          value={bodyMarkdown}
          onChangeText={setBodyMarkdown}
          placeholder="Write your story here..."
          accessibilityLabel="Story body"
          accessibilityHint="Enter the main story content"
          maxLength={5000}
          disabled={isLoading}
          multiline
          numberOfLines={8}
        />

        <BannerImageField
          value={bannerImage.previewUrl}
          disabled={isLoading}
          onChange={setBannerImage}
        />

        <StoryTextField
          label="Event Timeframe"
          value={eventTimeframe}
          onChangeText={setEventTimeframe}
          placeholder="e.g., Summer 2024, Winter Break"
          accessibilityLabel="Event timeframe"
          accessibilityHint="Enter when this story took place"
          maxLength={100}
          disabled={isLoading}
        />

        {error && (
          <View className="rounded-2xl bg-error/10 p-3">
            <Text className="text-small text-error">{error}</Text>
          </View>
        )}

        <View className="flex-row gap-3 pt-4">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancel creating story"
            accessibilityHint="Returns to the previous screen without creating a story"
            onPress={() => router.back()}
            disabled={isLoading}
            className="flex-1 rounded-2xl border border-neutral-lightest bg-surface py-3"
          >
            <Text className="text-center font-nunito-semibold text-body text-neutral">
              Cancel
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Create story"
            accessibilityHint="Submits the story for creation"
            onPress={handleSubmit}
            disabled={!isValidForm || isLoading}
            className={`flex-1 flex-row items-center justify-center rounded-2xl py-3 ${
              isValidForm && !isLoading ? "bg-primary" : "bg-neutral-lightest"
            }`}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.neutral.white} size="small" />
            ) : (
              <Text className="text-center font-nunito-semibold text-body text-neutral-white">
                Create
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}
