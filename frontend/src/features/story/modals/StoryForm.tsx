import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";
import { router } from "expo-router";

import { colors } from "@/constants/theme";
import { TabIcon } from "@/src/components/icons/TabIcon";
import { KeyboardSafeScrollView } from "@/src/components/layout/KeyboardSafeScrollView";

import BannerImageField from "../components/BannerImageField";
import { StoryTextField } from "../components/StoryTextField";
import { useStoryActions } from "../hooks/useStoryActions";
import { useStoryStore } from "../stores/storyStore";
import { StoryDetail } from "../types/story.types";

interface Props {
  story?: StoryDetail | null;
}

/**
 *
 * @param root0
 * @param root0.story
 */
export function StoryForm({ story }: Props) {
  const isEditMode = !!story;

  const {
    createStory,
    updateStory,
    isLoading,
    error,
    clearError = () => {},
  } = useStoryActions();
  const { addStoryToFeed, updateStoryInFeed } = useStoryStore();

  const [title, setTitle] = useState("");
  const [bodyMarkdown, setBodyMarkdown] = useState("");
  const [eventTimeframe, setEventTimeframe] = useState("");
  const [bannerImage, setBannerImage] = useState<{
    previewUrl?: string;
    bannerImageData?: string;
    bannerImageMimeType?: string;
    removed?: boolean;
  }>({});

  useEffect(() => {
    clearError();
    if (isEditMode && story) {
      setTitle(story.title || "");
      setBodyMarkdown(story.bodyMarkdown || "");
      setEventTimeframe(story.eventTimeframe || "");
      setBannerImage({ previewUrl: story.bannerImageUrl });
    }
  }, [isEditMode, story]);

  const isValidForm = title.trim().length > 0 && bodyMarkdown.trim().length > 0;

  const handleSubmit = async () => {
    if (!isValidForm) return;

    if (isEditMode && story) {
      const result = await updateStory(story.id, {
        title: title.trim(),
        bodyMarkdown: bodyMarkdown.trim(),
        eventTimeframe: eventTimeframe.trim() || undefined,
        bannerImageData: bannerImage.bannerImageData,
        bannerImageMimeType: bannerImage.bannerImageMimeType,
        ...(bannerImage.removed ? { bannerImageUrl: "" } : {}),
      });

      if (result) {
        updateStoryInFeed(story.id, result);
        Alert.alert("Success", "Story updated successfully!");
        router.back();
      }
    } else {
      const result = await createStory({
        title: title.trim(),
        bodyMarkdown: bodyMarkdown.trim(),
        eventTimeframe: eventTimeframe.trim() || undefined,
        bannerImageData: bannerImage.bannerImageData,
        bannerImageMimeType: bannerImage.bannerImageMimeType,
      });

      if (result) {
        addStoryToFeed(result);
        Alert.alert("Success", "Story created successfully!");
        router.back();
      }
    }

    if (error) {
      Alert.alert("Error", error);
    }
  };

  return (
    <KeyboardSafeScrollView>
      <View className="flex-grow flex-col gap-6 bg-surface px-6 pb-12 pt-4">
        <View className="mb-2 flex-row items-center justify-between">
          <Text className="font-nunito-bold text-heading text-neutral">
            {isEditMode ? "Edit Story" : "Create Story"}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Close ${isEditMode ? "edit" : "create"} story`}
            onPress={() => router.back()}
            disabled={isLoading}
            hitSlop={15}
            className="rounded-full bg-surface-gray p-2"
          >
            <TabIcon name="close" size={20} color={colors.primary.DEFAULT} />
          </Pressable>
        </View>

        <StoryTextField
          label="Title *"
          value={title}
          onChangeText={setTitle}
          placeholder="Enter story title"
          maxLength={200}
          disabled={isLoading}
          accessibilityLabel="Story Title Input"
          accessibilityHint="Type the title of your story here"
        />

        <StoryTextField
          label="Body (Markdown) *"
          value={bodyMarkdown}
          onChangeText={setBodyMarkdown}
          placeholder="Write your story here..."
          maxLength={5000}
          disabled={isLoading}
          multiline
          numberOfLines={8}
        />

        <BannerImageField
          value={bannerImage.removed ? undefined : bannerImage.previewUrl}
          disabled={isLoading}
          onChange={(next) => {
            setBannerImage({
              previewUrl: next.previewUrl,
              bannerImageData: next.bannerImageData,
              bannerImageMimeType: next.bannerImageMimeType,
              removed: !!next.removed,
            });
          }}
        />

        <StoryTextField
          label="Event Timeframe"
          value={eventTimeframe}
          onChangeText={setEventTimeframe}
          placeholder="e.g., Summer 2024, Winter Break"
          maxLength={100}
          disabled={isLoading}
        />

        {error && (
          <View className="rounded-2xl border border-error/20 bg-error/10 p-4">
            <Text className="font-nunito-semibold text-small text-error">
              {error}
            </Text>
          </View>
        )}

        <View className="flex-row gap-4 pb-16 pt-6">
          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            disabled={isLoading}
            className="flex-1 items-center justify-center rounded-2xl border border-neutral-lightest bg-surface py-4"
          >
            <Text className="text-center font-nunito-semibold text-body text-neutral">
              Cancel
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={handleSubmit}
            disabled={!isValidForm || isLoading}
            className={`flex-1 flex-row items-center justify-center rounded-2xl py-4 shadow-sm ${
              isValidForm && !isLoading ? "bg-primary" : "bg-neutral-lightest"
            }`}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.neutral.white} size="small" />
            ) : (
              <Text className="text-center font-nunito-semibold text-body text-neutral-white">
                {isEditMode ? "Update" : "Create"}
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </KeyboardSafeScrollView>
  );
}
