import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";

import { colors } from "@/constants/theme";

import { fetchEventsFeedApi } from "../api/event.api";
import type { Event } from "../types/event.types";

import { EventCard } from "./EventCard";

/**
 * Properties expected by the {@link EventSearch} component.
 */
interface Props {
  /**
   * The search query string input by the user. Whenever this prop updates,
   * a network request is triggered to search for matching events.
   */
  search: string;
}

/**
 * EventSearch is a component that renders a list of volunteer events matching a user search term.
 * It manages search querying state (loading, error, list data), fetches results using
 * the `fetchEventsFeedApi` helper, handles cleanup if the component unmounts or if the search
 * query updates before a query completes, and supports pull-to-refresh.
 *
 * @param props The props for the component.
 * @param props.search The query string used to filter events.
 * @returns {React.JSX.Element} A flat list of matching events, or an activity indicator / error text.
 */
export function EventSearch({ search }: Props) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!search) return;
    let cancelled = false;

    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchEventsFeedApi({
          search: search.trim(),
          limit: 50,
        });
        if (!cancelled) setEvents(data);
      } catch {
        if (!cancelled) setError("Some error occurred. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [search]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center p-4">
        <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center p-4">
        <Text className="text-center font-nunito-semibold text-[16px] text-error">
          {error}
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={events}
      keyExtractor={(item, index) => item._id || `event-${index}`}
      renderItem={({ item }) => <EventCard event={item} />}
      contentContainerStyle={{ padding: 4 }}
      showsVerticalScrollIndicator={false}
      refreshing={loading}
      onRefresh={() => {
        if (search) {
          setLoading(true);
          fetchEventsFeedApi({ search: search.trim(), limit: 50 })
            .then(setEvents)
            .catch(() => setError("Some error occurred. Please try again."))
            .finally(() => setLoading(false));
        }
      }}
      ListEmptyComponent={() => (
        <View className="flex-1 items-center justify-center p-4">
          <Text className="text-center font-nunito-semibold text-[16px] text-neutral-light">
            No events found for "{search}"
          </Text>
        </View>
      )}
    />
  );
}
