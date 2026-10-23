import React, { useCallback, useRef } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { Href, router } from "expo-router";

import {
  FlashList,
  type ListRenderItem,
  type ViewToken,
} from "@shopify/flash-list";

import { colors } from "@/constants/theme";

import { StorySummary } from "../types/story.types";
import { getStoryUrl } from "../utils/storyUrlUtils";

import StoryCard from "./StoryCard";

interface Props {
  stories: StorySummary[];
  isFetchingMore: boolean;
  isRefreshing: boolean;
  hasMore: boolean;
  isLoading: boolean;
  loadNextPage: () => void;
  refreshStories: () => void;
  onLike: (storyId: string) => Promise<void>;
  onCommentPress: (storyId: string, commentCount: number) => void;
}

/**
 * Renders the paginated story feed list.
 *
 * @param root0 - Story feed list props.
 * @param root0.stories - Stories to render.
 * @param root0.isFetchingMore - Whether the next page is loading.
 * @param root0.isRefreshing - Whether pull-to-refresh is active.
 * @param root0.hasMore - Whether another page may exist.
 * @param root0.isLoading - Whether the first page is loading.
 * @param root0.loadNextPage - Callback to load the next page.
 * @param root0.refreshStories - Callback to refresh stories.
 * @param root0.onLike - Callback to like a story.
 * @param root0.onCommentPress - Callback to open comments.
 * @returns The story feed list.
 */
export function StoriesFeedList({
  stories,
  isFetchingMore,
  isRefreshing,
  hasMore,
  isLoading,
  loadNextPage,
  refreshStories,
  onLike,
  onCommentPress,
}: Props) {
  const lastLoadMoreAtRef = useRef(0);
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 40 }).current;

  const throttledLoadNextPage = useCallback(() => {
    const now = Date.now();
    if (now - lastLoadMoreAtRef.current < 700) return;
    lastLoadMoreAtRef.current = now;
    if (hasMore && !isFetchingMore && !isLoading) loadNextPage();
  }, [hasMore, isFetchingMore, isLoading, loadNextPage]);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken<StorySummary>[] }) => {
      const isNearEnd = viewableItems.some(
        (item) => (item.index ?? -1) >= 7 && hasMore,
      );
      if (isNearEnd && !isFetchingMore && !isLoading) throttledLoadNextPage();
    },
    [hasMore, isFetchingMore, isLoading, throttledLoadNextPage],
  );

  const renderItem: ListRenderItem<StorySummary> = useCallback(
    ({ item }) => (
      <StoryCard
        story={item}
        onPress={() =>
          router.push(getStoryUrl(item.author.name, item.slug) as Href)
        }
        onLike={onLike}
        onCommentPress={() => onCommentPress(item.id, item.commentCount)}
      />
    ),
    [onCommentPress, onLike],
  );

  return (
    <FlashList
      data={stories}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
      onEndReached={throttledLoadNextPage}
      onEndReachedThreshold={0.25}
      showsVerticalScrollIndicator={false}
      ItemSeparatorComponent={() => <View className="h-3" />}
      ListFooterComponent={() =>
        isFetchingMore ? (
          <View className="py-6">
            <ActivityIndicator size="small" color={colors.primary.DEFAULT} />
          </View>
        ) : null
      }
      refreshing={isRefreshing}
      onRefresh={refreshStories}
      ListEmptyComponent={() => (
        <View className="flex-1 items-center justify-center py-24">
          <Text className="text-body text-neutral-gray">
            No stories available yet.
          </Text>
        </View>
      )}
    />
  );
}
