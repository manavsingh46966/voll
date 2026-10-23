import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";

import { Ionicons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";

import { colors } from "@/constants/theme";

import {
  useFollowUser,
  useUnfollowUser,
  useUserSearch,
} from "../hooks/useProfile";
import type { UserSearchCard } from "../types/profile.types";

const FALLBACK_AVATAR =
  "https://th.bing.com/th/id/OIP.rmim2jYzNpSCslo60INohQHaF9?w=246&h=198&c=7&r=0&o=5&pid=1.7";

function SearchResultCard({ user }: { user: UserSearchCard }) {
  const followMutation = useFollowUser(user.id);
  const unfollowMutation = useUnfollowUser(user.id);
  const isPending = followMutation.isPending || unfollowMutation.isPending;

  const handleToggleFollow = () => {
    if (user.isFollowing) {
      unfollowMutation.mutate();
    } else {
      followMutation.mutate();
    }
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint="Opens this person's profile"
      className="flex-row items-center border-b border-neutral-lightest px-4 py-3"
      onPress={() => router.push(`/(drawer)/(tabs)/profile/${user.id}`)}
    >
      <Image
        source={{ uri: user.profileImageUrl ?? FALLBACK_AVATAR }}
        className="h-12 w-12 rounded-full bg-primary-surface"
        contentFit="cover"
      />
      <View className="ml-3 flex-1">
        <Text
          className="font-nunito-bold text-[15px] text-neutral"
          numberOfLines={1}
        >
          {user.name ?? "Unnamed user"}
        </Text>
        <Text
          className="mt-0.5 font-nunito text-[12px] text-neutral-light"
          numberOfLines={1}
        >
          {user.city ?? `${user.followersCount} followers`}
        </Text>
        {!!user.bio && (
          <Text
            className="mt-1 font-nunito text-[12px] text-neutral-light"
            numberOfLines={1}
          >
            {user.bio}
          </Text>
        )}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={user.isFollowing ? "Unfollow user" : "Follow user"}
        accessibilityHint="Updates your follow relationship with this person"
        disabled={isPending}
        onPress={handleToggleFollow}
        className="ml-3 min-w-[88px] items-center rounded-lg px-3 py-2"
        style={{
          backgroundColor: user.isFollowing
            ? colors.surface.DEFAULT
            : colors.primary.DEFAULT,
          borderColor: colors.primary.DEFAULT,
          borderWidth: 1,
          opacity: isPending ? 0.6 : 1,
        }}
      >
        {isPending ? (
          <ActivityIndicator
            size="small"
            color={user.isFollowing ? colors.primary.DEFAULT : "#fff"}
          />
        ) : (
          <Text
            className="font-nunito-bold text-[12px]"
            style={{
              color: user.isFollowing ? colors.primary.DEFAULT : "#fff",
            }}
          >
            {user.isFollowing ? "Following" : "Follow"}
          </Text>
        )}
      </Pressable>
    </Pressable>
  );
}

/**
 * Search screen for finding people and following them.
 *
 * @returns The profile people search screen.
 */
export default function UserSearchScreen() {
  const [search, setSearch] = useState("");
  const trimmedSearch = search.trim();
  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    isError,
  } = useUserSearch(trimmedSearch);

  const users = useMemo(
    () => data?.pages.flatMap((page) => page.users) ?? [],
    [data],
  );

  return (
    <View className="flex-1 bg-surface">
      <View className="mx-4 mt-4 flex-row items-center rounded-xl bg-surface-gray px-3">
        <Ionicons name="search" size={18} color={colors.neutral.light} />
        <TextInput
          accessibilityLabel="Search people"
          accessibilityHint="Type at least two characters to search public profiles"
          className="ml-2 flex-1 py-3 font-nunito text-[15px] text-neutral"
          placeholder="Search people"
          placeholderTextColor={colors.neutral.light}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          returnKeyType="search"
        />
      </View>

      {trimmedSearch.length < 2 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center font-nunito-semibold text-[15px] text-neutral-light">
            Search by name, city, or bio.
          </Text>
        </View>
      ) : isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
        </View>
      ) : isError ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center font-nunito-semibold text-[15px] text-error">
            Unable to search people right now.
          </Text>
        </View>
      ) : (
        <FlashList
          data={users}
          renderItem={({ item }) => <SearchResultCard user={item} />}
          keyExtractor={(item) => item.id}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View className="py-4">
                <ActivityIndicator color={colors.primary.DEFAULT} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View className="items-center px-6 py-16">
              <Text className="text-center font-nunito-semibold text-[15px] text-neutral-light">
                No people found.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
