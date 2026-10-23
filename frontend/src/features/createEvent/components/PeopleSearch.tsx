import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";

import { colors } from "@/constants/theme";

import { searchPeopleApi } from "../api/event.api";
import type { Person } from "../types/event.types";

/**
 * Properties expected by the {@link PeopleSearch} component.
 */
interface Props {
  /**
   * The search query string typed by the user to find other registered users.
   * Updates to this string trigger a network request.
   */
  search: string;
}

/**
 * Fallback image URL used for user avatars if they do not have a custom profile photo set.
 */
const FALLBACK_AVATAR =
  "https://th.bing.com/th/id/OIP.rmim2jYzNpSCslo60INohQHaF9?w=246&h=198&c=7&r=0&o=5&pid=1.7";

/**
 * PeopleSearch is a component that renders a list of users/people matching a search query.
 * It manages state for searching (loading status, error states, and the resulting user list),
 * fetches data via `searchPeopleApi`, and renders each person in a touchable row
 * that navigates to their profile page using the router.
 *
 * @param props The props for the component.
 * @param props.search The query string used to find people.
 * @returns {React.JSX.Element} A list of matching users or feedback messages (loading/error).
 */
export function PeopleSearch({ search }: Props) {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!search) return;
    let cancelled = false;

    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await searchPeopleApi(search.trim());
        if (!cancelled) setPeople(data);
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
      data={people}
      keyExtractor={(item, index) => item._id || `person-${index}`}
      contentContainerStyle={{ padding: 8 }}
      showsVerticalScrollIndicator={false}
      refreshing={loading}
      onRefresh={() => {}}
      renderItem={({ item }) => (
        <TouchableOpacity
          accessibilityRole="button"
          className="flex-row items-center px-1 py-2"
          onPress={() => router.push(`/profile/${item._id}` as any)}
          activeOpacity={0.7}
        >
          <Image
            source={{ uri: FALLBACK_AVATAR }}
            className="h-12 w-12 rounded-full"
            contentFit="cover"
          />
          <Text className="ml-3 flex-1 font-nunito-semibold text-[16px] text-neutral">
            {item.name || item.email}
          </Text>
        </TouchableOpacity>
      )}
      ListEmptyComponent={() => (
        <View className="flex-1 items-center justify-center p-4">
          <Text className="text-center font-nunito-semibold text-[16px] text-neutral-light">
            No people found
          </Text>
        </View>
      )}
    />
  );
}
