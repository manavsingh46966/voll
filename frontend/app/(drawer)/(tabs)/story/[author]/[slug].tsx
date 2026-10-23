import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import Head from "expo-router/head";

import { BottomSheetModal } from "@gorhom/bottom-sheet";

import { colors } from "@/constants/theme";
import { IconWithBadge } from "@/src/components/icons/IconWithBadge";
import { TabIcon } from "@/src/components/icons/TabIcon";
import { ActionModal } from "@/src/components/ui/ActionModal";
import { ArticleAuthorBlock } from "@/src/features/story/components/ArticleAuthorBlock";
import { ArticleBannerImage } from "@/src/features/story/components/ArticleBannerImage";
import { StoryCommentsSheet } from "@/src/features/story/components/StoryCommentsSheet";
import { useStoryActions } from "@/src/features/story/hooks/useStoryActions";
import { useStoryArticle } from "@/src/features/story/hooks/useStoryArticle";
import DeleteConfirmModal from "@/src/features/story/modals/DeleteConfirmModal";
import { useStoryStore } from "@/src/features/story/stores/storyStore";
import { formatAuthorSlug } from "@/src/features/story/utils/storyUrlUtils";
import { useSessionStore } from "@/src/stores/session.store";

/**
 * Renders the immersive story article detail screen.
 * Handles viewing, analytics, engagement (likes/comments), and RBAC-secured modifications.
 *
 * @returns {JSX.Element} The story article screen.
 */
export default function StoryArticleScreen() {
  const { author, slug } = useLocalSearchParams<{
    author: string;
    slug: string;
  }>();
  const { story, isLoading, error, updateStoryLike, trackArticleRead } =
    useStoryArticle(slug);
  const { user } = useSessionStore();
  const { toggleLike, deleteStory } = useStoryActions();
  const { updateLikeState } = useStoryStore();
  const insets = useSafeAreaInsets();

  // --- STATE ---
  const [showAuthWall, setShowAuthWall] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteInProgress, setDeleteInProgress] = useState(false);

  const bottomSheetRef = useRef<BottomSheetModal>(null);

  // --- URL CANONICALIZATION ---
  useEffect(() => {
    if (story) {
      const canonicalAuthorSegment = `@${formatAuthorSlug(story.author.name)}`;
      if (author !== canonicalAuthorSegment) {
        router.replace(`/story/${canonicalAuthorSegment}/${slug}`);
      }
    }
  }, [story, author, slug]);

  // --- RBAC CALCULATION ---
  const isOwner = story && user ? story.author.id === user.id : false;
  const isSuperAdmin = user?.role === "superadmin";
  const canModify = isOwner || isSuperAdmin;

  // --- HANDLERS ---
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const scrolledPercentage =
      (layoutMeasurement.height + contentOffset.y) / contentSize.height;
    if (scrolledPercentage > 0.8) {
      trackArticleRead();
    }
  };

  const handleLike = useCallback(() => {
    if (!user) {
      setShowAuthWall(true);
      return;
    }
    if (!story) return;

    // 1. Capture the current state in case we need to roll back
    const previousIsLiked = story.isLiked;
    const previousLikeCount = story.likeCount;

    // 2. Calculate the new optimistic state
    const optimisticIsLiked = !previousIsLiked;
    const optimisticCount = optimisticIsLiked
      ? previousLikeCount + 1
      : previousLikeCount - 1;

    // 3. Update the UI instantly (Render 1)
    updateStoryLike(optimisticCount, optimisticIsLiked);
    updateLikeState(story.id, optimisticCount, optimisticIsLiked);

    // 4. Fire the API in the background. Notice there is NO `await` here!
    // We only care if it fails. If it succeeds, the UI is already correct.
    toggleLike(story.id)
      .then((result) => {
        // Optional: If your backend returns a wildly different count than expected,
        // you could sync it here, but generally, you leave it alone on success.
        if (!result) {
          // ROLLBACK: If it failed, revert to the previous state
          updateStoryLike(previousLikeCount, previousIsLiked);
          updateLikeState(story.id, previousLikeCount, previousIsLiked);
        }
      })
      .catch(() => {
        // ROLLBACK: If the network crashed, revert to the previous state
        updateStoryLike(previousLikeCount, previousIsLiked);
        updateLikeState(story.id, previousLikeCount, previousIsLiked);
      });
  }, [story, updateStoryLike, updateLikeState, toggleLike, user]);

  const openComments = useCallback(() => {
    if (!user) {
      setShowAuthWall(true);
      return;
    }
    bottomSheetRef.current?.present();
  }, [user]);

  const handleDeleteConfirm = async () => {
    if (!story) return;

    setDeleteInProgress(true);
    const success = await deleteStory(story.id);
    setDeleteInProgress(false);

    if (success) {
      setIsDeleting(false);
      // Route the user back to the feed since the story is gone
      router.back();
    } else {
      Alert.alert("Error", "Failed to delete story. Please try again.");
    }
  };

  // --- RENDERERS ---
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
      </View>
    );
  }

  if (error || !story) {
    return (
      <View className="flex-1 items-center justify-center bg-surface px-6">
        <Text className="text-center text-body text-neutral-gray">
          {error || "Unable to load the story. It may have been removed."}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          className="mt-6 rounded-2xl bg-surface-gray px-6 py-3"
        >
          <Text className="font-nunito-semibold text-neutral">Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface">
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
        visible={isDeleting}
        title="Delete Story"
        message="This will instantly remove your story. Are you sure?"
        isLoading={deleteInProgress}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setIsDeleting(false)}
      />

      <Head>
        <title>{story.title} - Volstory</title>
        <meta name="description" content={story.excerpt} />
      </Head>

      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom + 20, 80),
        }}
        scrollEventThrottle={400}
        onScroll={handleScroll}
      >
        <ArticleAuthorBlock
          name={story.author.name}
          createdAt={story.createdAt}
          eventTimeframe={story.eventTimeframe}
          authorId={story.author.id}
          profileImageUrl={story.author.profileImageUrl}
          isFollowing={story.author.isFollowing || false}
        />

        <Text className="mb-4 font-nunito-bold text-heading text-neutral">
          {story.title}
        </Text>

        {story.bannerImageUrl ? (
          <ArticleBannerImage uri={story.bannerImageUrl} />
        ) : null}

        <Text className="mb-8 text-body text-neutral-dark">
          {story.bodyMarkdown}
        </Text>

        {/* RBAC Controls (Only visible to owner/admin at the bottom of the reading experience) */}
        {canModify && (
          <View className="mb-8 flex-row items-center justify-end gap-4 rounded-2xl bg-surface-gray px-4 py-3">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Edit story"
              onPress={() =>
                router.push({
                  pathname: "/(modals)/story-form",
                  params: { story: JSON.stringify(story) },
                })
              }
              hitSlop={10}
            >
              <TabIcon name="edit" size={20} color={colors.primary.DEFAULT} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Delete story"
              onPress={() => setIsDeleting(true)}
              hitSlop={10}
            >
              <TabIcon name="trash" size={20} color={colors.error} />
            </Pressable>
          </View>
        )}
      </ScrollView>

      {story.status === "published" && (
        <View className="flex-row items-center border-t border-surface-gray bg-surface py-3">
          {/* Left Half: Comments */}
          <Pressable
            accessibilityRole="button"
            onPress={openComments}
            className="flex-1 flex-row items-center justify-center border-r border-surface-gray"
          >
            <IconWithBadge
              iconName="message"
              count={story.commentCount}
              color={colors.neutral.light}
            />
          </Pressable>

          {/* Right Half: Likes */}
          <Pressable
            accessibilityRole="button"
            onPress={handleLike}
            className="flex-1 flex-row items-center justify-center"
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

      <StoryCommentsSheet
        ref={bottomSheetRef}
        storyId={story.id}
        commentCount={story.commentCount}
      />
    </View>
  );
}
