import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";

import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import BottomSheet, { BottomSheetBackdrop, BottomSheetBackdropProps, BottomSheetScrollView } from "@gorhom/bottom-sheet";

import { colors } from "@/constants/theme";
import { useSessionStore } from "@/src/stores/session.store";

import { getGroupPhotoUrl } from "../api/groups.api";
import { MemberListItem } from "../components/MemberListItem";
import { GroupMembersSheet } from "../components/GroupMembersSheet";
import { useGroupStore } from "../stores/groupStore";
import { ActionModal } from "@/src/components/ui/ActionModal";

export function GroupDetailsScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const router = useRouter();
  const { user } = useSessionStore();

  const {
    activeGroup,
    isLoadingDetail,
    isMutating,
    availableUsers,
    isLoadingUsers,
    addMember,
    fetchGroupById,
    fetchAvailableUsers,
    updateGroup,
    deleteGroup,
    removeMember,
  } = useGroupStore();

  const optionsSheetRef = useRef<BottomSheet>(null);
  const membersSheetRef = useRef<BottomSheet>(null);
  const addPeopleSheetRef = useRef<BottomSheet>(null);
  const memberActionSheetRef = useRef<BottomSheet>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [selectedMember, setSelectedMember] = useState<{ id: string; name: string | null } | null>(null);

  // 🚨 1. Global Modal State
  const [modalConfig, setModalConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    actionLabel: string;
    secondaryLabel?: string;
    onAction: () => void;
    onSecondary?: () => void;
  }>({ visible: false, title: "", message: "", actionLabel: "", onAction: () => {} });

  const closeModal = () => setModalConfig((prev) => ({ ...prev, visible: false }));
  const showError = (message: string) => setModalConfig({ visible: true, title: "Error", message, actionLabel: "OK", onAction: closeModal });

  useEffect(() => {
    if (groupId) fetchGroupById(groupId);
  }, [groupId, fetchGroupById]);

  useEffect(() => {
    if (activeGroup) {
      setEditName(activeGroup.name);
      setEditDescription(activeGroup.description);
    }
  }, [activeGroup]);

  const renderBackdrop = useCallback((props: BottomSheetBackdropProps) => (
    <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.35} />
  ), []);

  const handleSaveEdit = async () => {
    if (!activeGroup) return;
    const ok = await updateGroup(activeGroup.id, { name: editName, description: editDescription });
    if (ok) setIsEditing(false);
    else showError("Failed to update group."); // 🚨 Replaced Alert
  };

  const handleDelete = () => {
    if (!activeGroup) return;
    optionsSheetRef.current?.close();
    // 🚨 2. Replaced Delete Alert
    setModalConfig({
      visible: true,
      title: "Delete Group",
      message: `Are you sure you want to delete "${activeGroup.name}"?`,
      actionLabel: "Delete",
      secondaryLabel: "Cancel",
      onSecondary: closeModal,
      onAction: async () => {
        closeModal();
        const ok = await deleteGroup(activeGroup.id);
        if (ok) router.replace("/groups");
        else setTimeout(() => showError("Failed to delete group."), 400); // Slight delay for smooth modal transition
      },
    });
  };

  const handleRemoveMember = (memberId: string, memberName: string | null) => {
    if (!activeGroup) return;
    // 🚨 3. Replaced Remove Member Alert
    setModalConfig({
      visible: true,
      title: "Remove Member",
      message: `Are you sure you want to remove ${memberName ?? "this member"}?`,
      actionLabel: "Remove",
      secondaryLabel: "Cancel",
      onSecondary: closeModal,
      onAction: async () => {
        closeModal();
        const ok = await removeMember(activeGroup.id, memberId);
        if (!ok) setTimeout(() => showError("Failed to remove member."), 400);
      },
    });
  };

  const handleOpenAddPeople = () => {
    membersSheetRef.current?.close(); // Close members sheet if open
    fetchAvailableUsers();
    addPeopleSheetRef.current?.expand();
  };

  const handleAddMember = async (userId: string) => {
    if (!activeGroup) return;
    await addMember(activeGroup.id, userId);
    // Optional: addPeopleSheetRef.current?.close(); if you want it to close automatically
  };

  if (isLoadingDetail) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
      </View>
    );
  }

  if (!activeGroup) return null;

  const photoUri = activeGroup.hasPhoto ? getGroupPhotoUrl(activeGroup.id) : null;
  const isOwner = activeGroup.author?.id === user?.id;
  const isAdmin = isOwner || activeGroup.admins?.some((a) => a.id === user?.id);

  const availableToAdd = availableUsers.filter(
    (u) => !activeGroup.members.some((m) => m.id === u.id),
  );

  return (
    <View className="flex-1 bg-surface">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <SafeAreaView edges={["bottom"]}>
          {/* Header & Photo Section */}
          <View className="relative items-center pb-5 pt-8">
            {photoUri ? (
              <Image source={{ uri: photoUri }} className="h-[120px] w-[120px] rounded-full border-[3px] border-primary-surface" contentFit="cover" />
            ) : (
              <View className="h-[120px] w-[120px] items-center justify-center rounded-full bg-primary-surface">
                <MaterialCommunityIcons name="account-group" size={56} color={colors.primary.DEFAULT} />
              </View>
            )}
            {isAdmin && (
              <TouchableOpacity accessibilityRole="button" className="absolute right-5 top-5 p-2" onPress={() => optionsSheetRef.current?.expand()}>
                <Feather name="more-vertical" size={22} color={colors.neutral.DEFAULT} />
              </TouchableOpacity>
            )}
          </View>

          {/* Group Info Section */}
          <View className="border-b-[6px] border-surface-gray px-6 pb-6">
            {isEditing ? (
              <>
                <TextInput className="mb-3 rounded-lg border border-neutral-lightest px-4 py-3 font-nunito text-[15px] text-neutral" value={editName} onChangeText={setEditName} placeholder="Group name" />
                <TextInput className="min-h-[80px] rounded-lg border border-neutral-lightest px-4 py-3 font-nunito text-[15px] text-neutral" value={editDescription} onChangeText={setEditDescription} placeholder="Description" multiline textAlignVertical="top" />
                <View className="mt-3 flex-row gap-3">
                  <TouchableOpacity className="flex-1 items-center rounded-lg bg-surface-gray py-3" onPress={() => setIsEditing(false)}>
                    <Text className="font-nunito-semibold text-[15px] text-neutral">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity className={`flex-1 items-center rounded-lg bg-primary py-3 ${isMutating ? 'opacity-50' : ''}`} onPress={handleSaveEdit} disabled={isMutating}>
                    {isMutating ? <ActivityIndicator size="small" color="#fff" /> : <Text className="font-nunito-semibold text-[15px] text-white">Save</Text>}
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <Text className="mb-2 text-center font-nunito-bold text-[24px] text-neutral">{activeGroup.name}</Text>
                {!!activeGroup.description && (
                  <Text className="text-center font-nunito text-[15px] leading-[22px] text-neutral-gray">{activeGroup.description}</Text>
                )}
              </>
            )}
          </View>

          {/* Preview Members List */}
          <View className="px-5 pt-5">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="font-nunito-bold text-[17px] text-neutral">Members ({activeGroup.memberCount})</Text>
              <TouchableOpacity onPress={() => membersSheetRef.current?.expand()}>
                <Text className="font-nunito-semibold text-[14px] text-primary">{isAdmin ? "Manage" : "View All"}</Text>
              </TouchableOpacity>
            </View>
            {activeGroup.members.slice(0, 3).map((member) => (
              <MemberListItem key={member.id} member={member} actionLabel={isAdmin ? "Manage" : ""} actionColor={colors.neutral.gray} onAction={isAdmin ? () => { setSelectedMember({ id: member.id, name: member.name }); memberActionSheetRef.current?.expand(); } : () => {}} disabled={isMutating} />
            ))}
          </View>
        </SafeAreaView>
      </ScrollView>

      {/* Extracted Figma Bottom Sheet */}
      <GroupMembersSheet
        ref={membersSheetRef}
        activeGroup={activeGroup}
        isAdmin={isAdmin}
        isMutating={isMutating}
        onClose={() => membersSheetRef.current?.close()}
        onAddPeople={handleOpenAddPeople}
        onRemoveMember={handleRemoveMember}
      />

      {/* Options Sheet */}
      <BottomSheet ref={optionsSheetRef} index={-1} snapPoints={["25%"]} enablePanDownToClose backdropComponent={renderBackdrop}>
        <View className="px-5 pt-2">
          <TouchableOpacity className="flex-row items-center py-4" onPress={() => { optionsSheetRef.current?.close(); setIsEditing(true); }}>
            <Feather name="edit-2" size={20} color={colors.neutral.DEFAULT} className="mr-3" />
            <Text className="font-nunito-semibold text-[16px] text-neutral">Edit Group</Text>
          </TouchableOpacity>
          {isOwner && (
            <TouchableOpacity className="flex-row items-center border-t border-neutral-lightest py-4" onPress={handleDelete}>
              <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.error} className="mr-3" />
              <Text className="font-nunito-semibold text-[16px] text-error">Delete Group</Text>
            </TouchableOpacity>
          )}
        </View>
      </BottomSheet>

      <BottomSheet 
        ref={addPeopleSheetRef} 
        index={-1} 
        snapPoints={["60%"]} 
        enablePanDownToClose 
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={{ backgroundColor: colors.neutral.lightest, width: 40 }}
        backgroundStyle={{ backgroundColor: "#ffffff", borderRadius: 24 }}
      >
        <View className="flex-row items-center justify-between border-b border-neutral-lightest px-6 py-4">
          <Text className="font-nunito-bold text-[18px] text-neutral">Add People</Text>
        </View>
        
        {isLoadingUsers ? (
          <View className="flex-1 items-center justify-center pt-10">
            <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
          </View>
        ) : (
          <BottomSheetScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 10, paddingBottom: 40 }}>
            {availableToAdd.length === 0 ? (
              <Text className="pt-10 text-center font-nunito text-[14px] text-neutral-light">
                No users available to add
              </Text>
            ) : (
              availableToAdd.map((user) => (
                <MemberListItem 
                  key={user.id} 
                  member={user} 
                  actionLabel="Add" 
                  actionColor={colors.primary.DEFAULT} 
                  onAction={() => handleAddMember(user.id)} 
                  disabled={isMutating} 
                />
              ))
            )}
          </BottomSheetScrollView>
        )}
      </BottomSheet>

      {/* 🚨 4. Mount the ActionModal at the root level */}
      <ActionModal
        visible={modalConfig.visible}
        title={modalConfig.title}
        message={modalConfig.message}
        actionLabel={modalConfig.actionLabel}
        onAction={modalConfig.onAction}
        secondaryLabel={modalConfig.secondaryLabel}
        onSecondary={modalConfig.onSecondary}
      />
    </View>
  );
}