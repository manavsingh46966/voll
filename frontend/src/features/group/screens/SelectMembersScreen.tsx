import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { Ionicons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";

import { colors } from "@/constants/theme";

import { MemberListItem } from "../components/MemberListItem";
import { useGroupStore } from "../stores/groupStore";
import type { AvailableUser } from "../types/group.types";

export function SelectMembersScreen() {
  const router = useRouter();
  // 🚨 1. Use the insets hook for bulletproof notch padding
  const insets = useSafeAreaInsets();
  
  const {
    availableUsers,
    isLoadingUsers,
    isLoadingMoreUsers,
    isMutating,
    createDraft,
    setCreateDraft,
    fetchAvailableUsers,
    fetchMoreAvailableUsers,
    createGroup,
    resetCreateDraft,
  } = useGroupStore();

  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    const term = searchText.trim();
    if (!term) {
      fetchAvailableUsers();
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      fetchAvailableUsers(term);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchText, fetchAvailableUsers]);

  const filteredUsers = availableUsers;
  const selectedIds = new Set(createDraft.selectedMembers.map((m) => m.id));

  const toggleMember = (user: AvailableUser) => {
    const next = selectedIds.has(user.id)
      ? createDraft.selectedMembers.filter((m) => m.id !== user.id)
      : [...createDraft.selectedMembers, user];
    setCreateDraft({ selectedMembers: next });
  };

  const handleCreate = async () => {
    const result = await createGroup({
      name: createDraft.name,
      description: createDraft.description,
      photoData: createDraft.photoData ?? undefined,
      photoMimeType: createDraft.photoMimeType ?? undefined,
      initialMembers: createDraft.selectedMembers.map((m) => m.id),
    });

    if (!result) {
      Alert.alert("Error", "Failed to create group. Please try again.");
      return;
    }

    resetCreateDraft();
    router.replace("/groups");
  };

  const renderItem = ({ item }: { item: AvailableUser }) => (
    <MemberListItem
      member={item}
      actionLabel={selectedIds.has(item.id) ? "Remove" : "Add"}
      actionColor={
        selectedIds.has(item.id) ? colors.error : colors.primary.DEFAULT
      }
      onAction={() => toggleMember(item)}
    />
  );

  return (
    <View 
      className="flex-1 bg-surface" 
      style={{ paddingTop: Math.max(insets.top, 16) }}
    >
      <View className="flex-row items-center justify-between border-b border-neutral-lightest px-5 py-3.5">
        <Text className="font-nunito-bold text-[20px] text-neutral">
          Add People
        </Text>
        <TouchableOpacity
          accessibilityRole="button"
          className={`min-w-[110px] items-center rounded-xl bg-primary px-4 py-2 ${
            isMutating ? "opacity-60" : "opacity-100"
          }`}
          onPress={handleCreate}
          disabled={isMutating}
          activeOpacity={0.8}
        >
          {isMutating ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="font-nunito-bold text-[14px] text-white">
              Create Group
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {createDraft.selectedMembers.length > 0 && (
        <View className="bg-primary-surface px-4 py-2">
          <Text className="font-nunito text-[12px] text-primary">
            {createDraft.selectedMembers.length} selected:{" "}
            {createDraft.selectedMembers
              .map((m) => m.name ?? m.city ?? "Unnamed user")
              .join(", ")}
          </Text>
        </View>
      )}

      <View className="mx-4 my-4 flex-row items-center rounded-xl bg-surface-gray px-3">
        <Ionicons
          name="search"
          size={18}
          color={colors.neutral.light}
          className="mr-2"
        />
        <TextInput
          accessibilityLabel="Text input field"
          className="flex-1 py-2.5 font-nunito text-[15px] text-neutral"
          placeholder="Search people"
          placeholderTextColor={colors.neutral.light}
          value={searchText}
          onChangeText={setSearchText}
          returnKeyType="search"
        />
      </View>

      {isLoadingUsers ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
        </View>
      ) : (
        <FlashList
          data={filteredUsers}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ 
            paddingHorizontal: 16, 
            paddingBottom: Math.max(insets.bottom, 24) 
          }}
          onEndReached={() => fetchMoreAvailableUsers(searchText.trim())}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            isLoadingMoreUsers ? (
              <View className="py-4">
                <ActivityIndicator
                  size="small"
                  color={colors.primary.DEFAULT}
                />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View className="items-center pt-[60px]">
              <Text className="font-nunito text-[15px] text-neutral-light">
                No users found
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}