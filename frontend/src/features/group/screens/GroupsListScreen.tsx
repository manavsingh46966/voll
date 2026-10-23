import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";

import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";

import { colors } from "@/constants/theme";
import { TabIcon } from "@/src/components/icons/TabIcon";

import { GroupCard } from "../components/GroupCard";
import { useGroupStore } from "../stores/groupStore";
import type { GroupSummary } from "../types/group.types";

export function GroupsListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { groups, isLoading, isMutating, error, fetchGroups, deleteGroup } =
    useGroupStore();
  const [deleteMode, setDeleteMode] = useState(false);
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleDeleteGroup = useCallback(
    (group: GroupSummary) => {
      Alert.alert(
        "Delete Group",
        `Are you sure you want to delete "${group.name}"?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              const ok = await deleteGroup(group.id);
              if (!ok) Alert.alert("Error", "Failed to delete group.");
              else setDeleteMode(false);
            },
          },
        ],
      );
    },
    [deleteGroup],
  );

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
      </View>
    );
  }

  if (groups.length === 0) {
    return (
      <View className="flex-1 bg-surface">
        <Stack.Screen options={{ headerShown: false }} />

        <View
          className="flex-row items-center bg-primary px-2 pb-2"
          style={{ paddingTop: Math.max(insets.top, 8) }}
        >
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => router.back()}
            className="z-10 p-2"
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View className="absolute bottom-4 left-0 right-0 items-center">
            <Text className="font-nunito-bold text-lg text-white">
              User Groups
            </Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="items-center px-6 pt-16">
            <View className="mb-8 h-[130px] w-[130px] items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/40">
              <TabIcon name="users" size={64} color="white" focused />
            </View>
            <Text className="mb-4 font-nunito-bold text-[22px] text-primary">
              Introducing Groups
            </Text>
            <Text className="font-nunito text-[15px] leading-6 text-neutral-light">
              Creating groups of people enables you to send out invites to a large
              number of people all at once, while hosting events.
            </Text>

            {/* Expandable Bullet Points */}
            {showMore && (
              <View className="mt-6 w-full px-2 max-w-[700px]">
                <View className="mb-6 h-px w-full bg-surface-gray" />
                <View className="mb-4 flex-row pr-4">
                  <View className="mr-3 mt-2 h-1.5 w-1.5 rounded-full bg-primary" />
                  <Text className="font-nunito text-[14px] leading-5 text-neutral-light">
                    This feature helps to invite large groups of people all at once,
                    rather than inviting each person one by one.
                  </Text>
                </View>
                <View className="mb-4 flex-row pr-4">
                  <View className="mr-3 mt-2 h-1.5 w-1.5 rounded-full bg-primary" />
                  <Text className="font-nunito text-[14px] leading-5 text-neutral-light">
                    Persons in a group won't know that they are part of a group.
                  </Text>
                </View>
              </View>
            )}

            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => setShowMore(!showMore)}
              className="mt-6 rounded border border-neutral-light px-5 py-2"
            >
              <Text className="font-nunito-semibold text-[14px] text-neutral-light">
                {showMore ? "Read Less" : "Read More"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <View
          className="px-6 mb-4"
          style={{ paddingBottom: Math.max(insets.bottom, 24) }}
        >
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => router.push("/groups/create")}
            className="items-center rounded-xl bg-primary py-4"
          >
            <Text className="font-nunito-bold text-[16px] text-white">
              Create a user group
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface">
      <Stack.Screen options={{ headerShown: false }} />

      {/* 1. Figma Teal Header */}
      <View
        className="flex-row items-center bg-primary px-2 pb-2"
        style={{ paddingTop: Math.max(insets.top, 8) }}
      >
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => router.back()}
          className="z-10 p-2"
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <View className="absolute bottom-4 left-0 right-0 items-center pointer-events-none">
          <Text className="font-nunito-bold text-[18px] text-white">
            Your Groups
          </Text>
        </View>

        <View className="ml-auto">
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => setDeleteMode((v) => !v)}
            className="z-10 p-2"
          >
            {deleteMode ? (
              <Text className="font-nunito-bold text-[16px] text-white">Done</Text>
            ) : (
              <Ionicons name="ellipsis-vertical" size={24} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {error && (
        <View className="bg-red-50 px-4 py-3">
          <Text className="font-nunito text-[13px] text-error">{error}</Text>
        </View>
      )}

      {/* 2. Clean White List */}
      <FlashList
        data={groups}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingTop: 8,
          width: "90%",
          alignSelf: "center",
          paddingBottom: Math.max(insets.bottom),
        }}
        renderItem={({ item }) => (
          <GroupCard
            group={item}
            onPress={() =>
              !deleteMode && router.push(`/groups/${item.id}`)
            }
            showDeleteButton={deleteMode}
            onDelete={() => handleDeleteGroup(item)}
          />
        )}
      />

      <TouchableOpacity
        accessibilityRole="button"
        onPress={() => router.push("/groups/create")}
        disabled={isMutating}
        className="absolute right-6 h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/40"
        style={{ bottom: Math.max(insets.bottom, 24) }}
      >
        <MaterialCommunityIcons name="plus" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

export default GroupsListScreen;