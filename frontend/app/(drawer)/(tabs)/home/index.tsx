import React, { useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { FlashList } from "@shopify/flash-list";

import { colors } from "@/constants/theme";
import { EventCard } from "@/src/features/createEvent/components/EventCard";
import { EventSearch } from "@/src/features/createEvent/components/EventSearch";
import { PeopleSearch } from "@/src/features/createEvent/components/PeopleSearch";
import { useEventsFeed } from "@/src/features/createEvent/hooks/useEventsFeed";

type ActiveTab = "events" | "people";

/**
 * Home tab: the published events feed with pull-to-refresh and infinite
 * scroll, plus a search bar that switches to event/people search results.
 *
 * @returns The rendered home screen.
 */
export default function HomeScreen(): React.JSX.Element {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<ActiveTab>("events");
  const {
    events,
    isLoading: loading,
    isRefreshing: refreshing,
    isFetchingNextPage: bottomLoading,
    error,
    refresh: onRefresh,
    loadMore: onEndReached,
  } = useEventsFeed();

  const isSearchActive = search.trim().length > 0;

  return (
    <View className="flex-1 bg-surface-gray">
      <View className="bg-surface px-4 pb-2 pt-3">
        <TextInput
          accessibilityLabel="Search events or people"
          accessibilityHint="Filters the feed as you type"
          className="rounded-xl bg-surface-gray px-4 py-2.5 font-nunito text-[15px] text-neutral-black"
          placeholder="Search events or people..."
          placeholderTextColor={colors.neutral.light}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
      </View>

      {isSearchActive && (
        <View className="flex-row border-b border-neutral-lightest bg-surface">
          {(["events", "people"] as ActiveTab[]).map((tab) => (
            <TouchableOpacity
              accessibilityRole="button"
              key={tab}
              className={`flex-1 items-center border-b-2 py-3 ${activeTab === tab ? "border-primary" : "border-transparent"}`}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                className={`font-nunito-semibold text-[14px] capitalize ${activeTab === tab ? "text-primary" : "text-neutral-light"}`}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {isSearchActive ? (
        <View className="flex-1">
          {activeTab === "events" ? (
            <EventSearch search={search} />
          ) : (
            <PeopleSearch search={search} />
          )}
        </View>
      ) : loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center font-nunito-semibold text-[16px] text-error">
            {error}
          </Text>
        </View>
      ) : (
        <FlashList
          data={events}
          keyExtractor={(item, index) => item._id || `event-${index}`}
          renderItem={({ item }) => <EventCard event={item} />}
          contentContainerStyle={{ padding: 8, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary.DEFAULT}
            />
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            bottomLoading ? (
              <View className="py-5">
                <ActivityIndicator
                  size="small"
                  color={colors.primary.DEFAULT}
                />
              </View>
            ) : null
          }
          ListEmptyComponent={() => (
            <View className="flex-1 items-center justify-center py-20">
              <Text className="font-nunito-semibold text-[16px] text-neutral-light">
                No events yet
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}
