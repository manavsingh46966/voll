import React, { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";
import { router } from "expo-router";

import { BottomSheetModal } from "@gorhom/bottom-sheet";

import { colors } from "@/constants/theme";
import { ActionModal } from "@/src/components/ui/ActionModal";
import { useSessionStore } from "@/src/stores/session.store";

import { StoriesFeedList } from "../components/StoriesFeedList";
import { StoryCommentsSheet } from "../components/StoryCommentsSheet";
import { useStoryActions } from "../hooks/useStoryActions";
import { useStoryFeed } from "../hooks/useStoryFeed";
import DeleteConfirmModal from "../modals/DeleteConfirmModal";
import { StoryDetail } from "../types/story.types";

interface StoriesScreenProps {
  authorId?: string;
}

/**
 * Renders a story feed for all stories or a selected author.
 *
 * @param root0 - Story screen props.
 * @param root0.authorId - Optional author filter or "me".
 * @returns The story feed screen.
 */
export default function StoriesScreen({ authorId }: StoriesScreenProps) {
  const {
    stories,
    isLoading,
    isFetchingMore,
    isRefreshing,
    hasMore,
    error,
    loadStories,
    loadNextPage,
    refreshStories,
    updateLikeState,
    removeStoryFromFeed,
  } = useStoryFeed(authorId);
  const { toggleLike, deleteStory } = useStoryActions();
  const { user } = useSessionStore();
  const [editingStory, setEditingStory] = useState<StoryDetail | null>(null);
  const [deletingStoryId, setDeletingStoryId] = useState<string | null>(null);
  const [deleteInProgress, setDeleteInProgress] = useState(false);
  const [selectedStoryForComments, setSelectedStoryForComments] = useState<{
    id: string;
    commentCount: number;
  } | null>(null);
  const [showAuthWall, setShowAuthWall] = useState(false);

  const bottomSheetRef = useRef<BottomSheetModal>(null);

  const handleLike = useCallback(
    async (storyId: string) => {
      if (!user) {
        setShowAuthWall(true);
        return;
      }

      // Find story context in feed
      const feedStory = stories.find((s) => s.id === storyId);
      if (!feedStory) return;

      const currentIsLiked = feedStory.isLiked;
      const currentLikeCount = feedStory.likeCount;

      // Optimistic toggle
      const optimisticIsLiked = !currentIsLiked;
      const optimisticCount = optimisticIsLiked
        ? currentLikeCount + 1
        : currentLikeCount - 1;

      updateLikeState(storyId, optimisticCount, optimisticIsLiked);

      // Call API
      const result = await toggleLike(storyId);
      if (result) {
        // Sync actual values from server
        const finalIsLiked = result.isLiked ?? optimisticIsLiked;
        updateLikeState(storyId, result.likeCount, finalIsLiked);
      } else {
        // Rollback on failure
        updateLikeState(storyId, currentLikeCount, currentIsLiked);
      }
    },
    [stories, toggleLike, updateLikeState, user],
  );

  const handleCommentPress = useCallback(
    (storyId: string, commentCount: number) => {
      if (!user) {
        setShowAuthWall(true);
        return;
      }
      setSelectedStoryForComments({ id: storyId, commentCount });
      setTimeout(() => {
        bottomSheetRef.current?.present();
      }, 100);
    },
    [user],
  );

  const handleDelete = async () => {
    if (!deletingStoryId) return;

    setDeleteInProgress(true);
    const success = await deleteStory(deletingStoryId);
    setDeleteInProgress(false);

    if (success) {
      removeStoryFromFeed(deletingStoryId);
      setDeletingStoryId(null);
      Alert.alert("Success", "Story deleted successfully!");
    } else {
      Alert.alert("Error", "Failed to delete story. Please try again.");
    }
  };

  return (
    <View className="flex-1 bg-surface-gray px-4 pt-4">
      <ActionModal
        visible={showAuthWall}
        title="Login Required"
        message="Please log in or create an account to interact with stories."
        actionLabel="Go to Login"
        onAction={() => {
          setShowAuthWall(false);
          router.push("/(auth)/login");
        }}
        secondaryLabel="Cancel"
        onSecondary={() => setShowAuthWall(false)}
      />

      <DeleteConfirmModal
        visible={!!deletingStoryId}
        title="Delete Story"
        message="This action cannot be undone. Are you sure you want to delete this story?"
        isLoading={deleteInProgress}
        onConfirm={handleDelete}
        onCancel={() => setDeletingStoryId(null)}
      />

      {isLoading && stories.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
        </View>
      ) : error && stories.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-body text-neutral-gray">
            {error}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retry loading stories"
            accessibilityHint="Attempts to load the story feed again"
            className="mt-4 rounded-xl bg-primary px-5 py-2"
            onPress={() => void loadStories()}
          >
            <Text className="font-nunito-semibold text-neutral-white">
              Retry
            </Text>
          </Pressable>
        </View>
      ) : (
        <StoriesFeedList
          stories={stories}
          isFetchingMore={isFetchingMore}
          isRefreshing={isRefreshing}
          hasMore={hasMore}
          isLoading={isLoading}
          loadNextPage={loadNextPage}
          refreshStories={refreshStories}
          onLike={handleLike}
          onCommentPress={handleCommentPress}
        />
      )}

      {selectedStoryForComments && (
        <StoryCommentsSheet
          ref={bottomSheetRef}
          storyId={selectedStoryForComments.id}
          commentCount={selectedStoryForComments.commentCount}
        />
      )}
    </View>
  );
}
