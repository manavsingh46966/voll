import React, { useCallback } from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";

import { useEventSearch } from "../hooks/useEventSearch";
import type { EventItem } from "../types";
import { EventCard } from "./EventCard";

interface EventSearchProps {
  search: string;
}

/**
 * Renders event search results for a given query.
 * Mirrors old_vol EventSearch using TanStack Query.
 *
 * @param root0 - Component props.
 * @param root0.search - The search query string.
 */
export function EventSearch({ search }: EventSearchProps) {
  const { data, isLoading, isError, refetch, isRefetching } = useEventSearch(search);

  const events: EventItem[] = data ?? [];

  const renderEmpty = useCallback(
    () => (
      <View className="flex-1 items-center justify-center p-4">
        <Text className="font-nunito text-body text-neutral-gray">
          No events found for &ldquo;{search}&rdquo;
        </Text>
      </View>
    ),
    [search],
  );

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#01A39F" />
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 items-center justify-center p-4">
        <Text className="font-nunito text-body text-error">
          Something went wrong. Please try again.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={events}
      renderItem={({ item }) => <EventCard event={item} />}
      keyExtractor={(item) => item._id}
      contentContainerStyle={{ padding: 8 }}
      showsVerticalScrollIndicator={false}
      refreshing={isRefetching}
      onRefresh={refetch}
      ListEmptyComponent={renderEmpty}
    />
  );
}
