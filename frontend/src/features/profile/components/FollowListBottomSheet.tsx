import React, { useCallback } from "react";
import { ActivityIndicator, Alert, NativeScrollEvent, NativeSyntheticEvent, Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";

import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetView,
} from "@gorhom/bottom-sheet";

import { colors } from "@/constants/theme";
import { useSessionStore } from "@/src/stores/session.store";

import { useFollowUser, useUnfollowUser } from "../hooks/useFollowMutation";
import { useFollowers, useFollowing } from "../hooks/useProfile";
import type { FollowUser } from "../types/profile.types";

/* eslint-disable max-lines */

interface UserItemProps {
  user: FollowUser;
  mode: "followers" | "following";
  onPress: () => void;
}

const PLACEHOLDER_AVATAR =
  "https://ui-avatars.com/api/?background=01A39F&color=fff&size=64&name=U";

function UserItem({ user, mode, onPress }: UserItemProps) {
  const { user: sessionUser } = useSessionStore();
  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();
  const isPending = followMutation.isPending || unfollowMutation.isPending;
  const canAct = !!sessionUser && sessionUser.id !== user.id && !user.isOwner;
  const isFollowing = !!user.isFollowing;

  const handleAction = () => {
    if (!canAct || isPending) return;

    if (isFollowing) {
      Alert.alert("Unfollow", `Unfollow ${user.name ?? "this user"}?`, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unfollow",
          style: "destructive",
          onPress: () => unfollowMutation.mutate(user.id),
        },
      ]);
      return;
    }

    followMutation.mutate(user.id);
  };

  const actionLabel = isFollowing
    ? "Following"
    : mode === "followers" && user.followsYou
      ? "Follow back"
      : "Follow";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`View ${user.name ?? "user"}'s profile`}
      accessibilityHint="Opens this person's profile"
      onPress={onPress}
      className="flex-row items-center px-4 py-3"
      style={{
        borderBottomWidth: 1,
        borderBottomColor: colors.neutral.lightest,
      }}
    >
      <Image
        source={
          user.profileImageUrl
            ? { uri: user.profileImageUrl }
            : { uri: PLACEHOLDER_AVATAR }
        }
        contentFit="cover"
        className="h-11 w-11 rounded-full"
      />
      <View className="ml-3 flex-1">
        <Text className="font-nunito-bold text-base text-neutral">
          {user.name ?? "Unknown User"}
        </Text>
        {user.bio ? (
          <Text
            className="mt-0.5 text-sm text-neutral-light"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {user.bio}
          </Text>
        ) : null}
      </View>
      {canAct ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${actionLabel} ${user.name ?? "user"}`}
          accessibilityHint={
            isFollowing ? "Unfollows this person" : "Follows this person"
          }
          disabled={isPending}
          onPress={(event) => {
            event.stopPropagation();
            handleAction();
          }}
          className="ml-3 min-w-24 items-center rounded-lg px-3 py-2"
          style={{
            backgroundColor: isFollowing
              ? colors.surface.DEFAULT
              : colors.primary.DEFAULT,
            borderWidth: isFollowing ? 1 : 0,
            borderColor: colors.primary.DEFAULT,
            opacity: isPending ? 0.6 : 1,
          }}
        >
          {isPending ? (
            <ActivityIndicator
              size="small"
              color={isFollowing ? colors.primary.DEFAULT : "#ffffff"}
            />
          ) : (
            <Text
              className="font-nunito-bold text-xs"
              style={{ color: isFollowing ? colors.primary.DEFAULT : "#ffffff" }}
            >
              {actionLabel}
            </Text>
          )}
        </Pressable>
      ) : null}
    </Pressable>
  );
}

interface Props {
  userId: string;
  mode: "followers" | "following";
  sheetRef: React.RefObject<BottomSheet | null>;
}

/**
 * Renders the paginated followers/following sheet with inline relationship actions.
 *
 * @param root0 - Component props.
 * @param root0.userId - Profile owner user ID.
 * @param root0.mode - Follow list mode.
 * @param root0.sheetRef - Ref used by parent screens to open and close the sheet.
 * @returns Followers/following bottom sheet.
 */
export function FollowListBottomSheet({ userId, mode, sheetRef }: Props) {
  const snapPoints = ["60%", "90%"];

  const {
    data: followersData,
    fetchNextPage: fetchMoreFollowers,
    hasNextPage: hasMoreFollowers,
    isFetchingNextPage: isFetchingMoreFollowers,
    isLoading: isLoadingFollowers,
  } = useFollowers(userId, mode === "followers");

  const {
    data: followingData,
    fetchNextPage: fetchMoreFollowing,
    hasNextPage: hasMoreFollowing,
    isFetchingNextPage: isFetchingMoreFollowing,
    isLoading: isLoadingFollowing,
  } = useFollowing(userId, mode === "following");

  const activeData = mode === "followers" ? followersData : followingData;
  const fetchMore =
    mode === "followers" ? fetchMoreFollowers : fetchMoreFollowing;
  const hasMore = mode === "followers" ? hasMoreFollowers : hasMoreFollowing;
  const isFetchingMore =
    mode === "followers" ? isFetchingMoreFollowers : isFetchingMoreFollowing;
  const isLoading =
    mode === "followers" ? isLoadingFollowers : isLoadingFollowing;

  const users = activeData?.pages.flatMap((page) => page.users) ?? [];

  const title = mode === "followers" ? "Followers" : "Following";

  const renderItem = useCallback(
    ({ item }: { item: FollowUser }) => (
      <UserItem
        user={item}
        mode={mode}
        onPress={() => {
          sheetRef.current?.close();
          router.push(`/(drawer)/(tabs)/profile/${item.id}`);
        }}
      />
    ),
    [mode, sheetRef],
  );

  const renderFooter = useCallback(() => {
    if (!isFetchingMore) return null;
    return (
      <View className="py-4">
        <ActivityIndicator color={colors.primary.DEFAULT} />
      </View>
    );
  }, [isFetchingMore]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 100; // Trigger fetch when 100px from the bottom
    
    if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
      if (hasMore && !isFetchingMore) fetchMore();
    }
  };

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1} // Start closed
      snapPoints={snapPoints}
      enablePanDownToClose
      backgroundStyle={{ backgroundColor: colors.surface.DEFAULT }}
      handleIndicatorStyle={{ backgroundColor: colors.neutral.lightest }}
    >
      <BottomSheetView className="px-4 pb-3 pt-1">
        <Text className="text-center font-nunito-bold text-lg text-neutral">
          {title}
        </Text>
      </BottomSheetView>

      {isLoading ? (
        <BottomSheetView className="flex-1 items-center justify-center py-10">
          <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
        </BottomSheetView>
      ) : users.length === 0 ? (
        <BottomSheetView className="flex-1 items-center justify-center py-10">
          <Text className="text-neutral-light">
            {mode === "followers"
              ? "No followers yet."
              : "Not following anyone yet."}
          </Text>
        </BottomSheetView>
      ) : (
        <BottomSheetScrollView
          onScroll={handleScroll}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {users.map((item) => (
            <UserItem
              key={item.id}
              user={item}
              mode={mode}
              onPress={() => {
                sheetRef.current?.close();
                router.push(`/(drawer)/(tabs)/profile/${item.id}`);
              }}
            />
          ))}
          {renderFooter()}
        </BottomSheetScrollView>
      )}
    </BottomSheet>
  );
}
