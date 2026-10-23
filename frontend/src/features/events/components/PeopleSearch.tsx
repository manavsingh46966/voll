import React, { useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Text,
  View,
} from "react-native";

import { usePeopleSearch } from "../hooks/usePeopleSearch";
import type { Person } from "../types";

const FALLBACK_AVATAR =
  "https://th.bing.com/th/id/OIP.rmim2jYzNpSCslo60INohQHaF9?w=246&h=198&c=7&r=0&o=5&pid=1.7";

interface PeopleSearchProps {
  search: string;
}

/**
 * Renders people search results for a given query.
 * Mirrors old_vol PeopleSearch using TanStack Query.
 *
 * @param root0 - Component props.
 * @param root0.search - The search query string.
 */
export function PeopleSearch({ search }: PeopleSearchProps) {
  const { data, isLoading, isError, refetch, isRefetching } = usePeopleSearch(search);

  const people: Person[] = data ?? [];

  const renderItem = useCallback(
    ({ item }: { item: Person }) => (
      <View className="mx-1 my-1.5 flex-row items-center rounded-lg bg-surface p-3">
        <Image
          source={{ uri: item.profileImageUrl || FALLBACK_AVATAR }}
          className="h-12 w-12 rounded-full"
        />
        <View className="ml-3 flex-1">
          <Text className="font-nunito-bold text-big text-neutral-black">
            {item.name ?? "Unknown"}
          </Text>
          {item.email ? (
            <Text className="font-nunito text-small text-neutral-light" numberOfLines={1}>
              {item.email}
            </Text>
          ) : null}
        </View>
      </View>
    ),
    [],
  );

  const renderEmpty = useCallback(
    () => (
      <View className="flex-1 items-center justify-center p-4">
        <Text className="font-nunito text-body text-neutral-gray">
          No people found for &ldquo;{search}&rdquo;
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
      data={people}
      renderItem={renderItem}
      keyExtractor={(item) => item._id}
      contentContainerStyle={{ padding: 8 }}
      showsVerticalScrollIndicator={false}
      refreshing={isRefetching}
      onRefresh={refetch}
      ListEmptyComponent={renderEmpty}
    />
  );
}
