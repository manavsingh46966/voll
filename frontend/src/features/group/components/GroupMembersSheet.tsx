import React, { forwardRef } from "react";
import { Text, TouchableOpacity, View } from "react-native";

import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";

import { colors } from "@/constants/theme";
import { MemberListItem } from "./MemberListItem";
import type { GroupDetail } from "../types/group.types";

interface GroupMembersSheetProps {
  activeGroup: GroupDetail;
  isAdmin: boolean;
  isMutating: boolean;
  onClose: () => void;
  onAddPeople: () => void;
  onRemoveMember: (memberId: string, memberName: string | null) => void;
}

export const GroupMembersSheet = forwardRef<BottomSheet, GroupMembersSheetProps>(
  (
    { activeGroup, isAdmin, isMutating, onClose, onAddPeople, onRemoveMember },
    ref,
  ) => {
    const renderBackdrop = React.useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.35} />
      ),
      [],
    );

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={["60%"]}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={{ backgroundColor: colors.neutral.lightest, width: 40 }}
        backgroundStyle={{ backgroundColor: "#ffffff", borderRadius: 24 }}
      >
        {/* Figma Header */}
        <View className="flex-row items-center justify-between px-6 py-4">
          <Text className="font-nunito-bold text-[16px] text-neutral">
            Group members ({activeGroup.memberCount})
          </Text>
          <TouchableOpacity accessibilityRole="button" onPress={onClose} className="p-1">
            <Text className="font-nunito-bold text-[14px] uppercase text-primary">
              Done
            </Text>
          </TouchableOpacity>
        </View>

        <BottomSheetScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}>
          {/* Figma Add People Button */}
          {isAdmin && (
            <TouchableOpacity
              accessibilityRole="button"
              onPress={onAddPeople}
              className="mb-6 mt-2 flex-row items-center justify-center rounded-lg border border-primary py-3"
            >
              <Text className="mr-2 font-nunito-regular text-[20px] leading-6 text-primary">
                +
              </Text>
              <Text className="font-nunito-semibold text-[15px] text-primary">
                Add People
              </Text>
            </TouchableOpacity>
          )}

          {/* Figma Member List */}
          {activeGroup.members.map((member) => (
            <MemberListItem
              key={member.id}
              member={member}
              actionLabel={isAdmin ? "Remove" : ""}
              actionColor="#ef4444" // Tailwind text-red-500 matching the Figma mockup
              onAction={
                isAdmin
                  ? () => onRemoveMember(member.id, member.name)
                  : () => {}
              }
              disabled={isMutating}
            />
          ))}
        </BottomSheetScrollView>
      </BottomSheet>
    );
  },
);

GroupMembersSheet.displayName = "GroupMembersSheet";