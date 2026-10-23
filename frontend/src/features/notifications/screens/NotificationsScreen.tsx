import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "@/constants/theme";

import { NotificationCard } from "../components/NotificationCard";
import { NotificationEmptyState } from "../components/NotificationEmptyState";
import { NotificationFilterChips } from "../components/NotificationFilterChips";
import { NotificationHeader } from "../components/NotificationHeader";
import {
  useDeleteNotification,
  useMarkAllAsRead,
  useMarkAsRead,
  useNotifications,
} from "../hooks/useNotifications";
import type {
  NotificationFilter,
  NotificationItem,
} from "../types/notification.types";

export default function NotificationsScreen() {
  const [selectedFilter, setSelectedFilter] =
    useState<NotificationFilter>("all");

  const {
    data,
    isLoading,
    isRefetching,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useNotifications(selectedFilter);

  const { mutate: markAsRead } = useMarkAsRead();
  const { mutate: markAllAsRead, isPending: isMarkingAllRead } =
    useMarkAllAsRead();
  const { mutate: deleteNotification } = useDeleteNotification();

  // Flatten infinite query pages
  const notifications: NotificationItem[] =
    data?.pages.flatMap((page) => page.notifications) ?? [];

  const unreadCount = data?.pages[0]?.unreadCount ?? 0;

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
      {/* Top Header */}
      <NotificationHeader
        unreadCount={unreadCount}
        onMarkAllAsRead={() => markAllAsRead()}
        isMarkingAllRead={isMarkingAllRead}
      />

      {/* Filter Tabs */}
      <NotificationFilterChips
        selectedFilter={selectedFilter}
        onSelectFilter={setSelectedFilter}
        unreadCount={unreadCount}
      />

      {/* Main List */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id || item._id || Math.random().toString()}
          renderItem={({ item }) => (
            <NotificationCard
              notification={item}
              onMarkAsRead={(id) => markAsRead(id)}
              onDelete={(id) => deleteNotification(id)}
            />
          )}
          contentContainerStyle={{
            paddingTop: 8,
            paddingBottom: 40,
            flexGrow: 1,
          }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary.DEFAULT}
            />
          }
          ListEmptyComponent={
            <NotificationEmptyState filter={selectedFilter} />
          }
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View className="py-4">
                <ActivityIndicator
                  size="small"
                  color={colors.primary.DEFAULT}
                />
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}
