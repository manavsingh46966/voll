import React, { useCallback, useMemo } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";

import { colors } from "@/constants/theme";
import { TabIcon } from "@/src/components/icons/TabIcon";

interface Props {
  sheetRef: React.RefObject<BottomSheetModal | null>;
}

/**
 *
 * @param root0
 * @param root0.sheetRef
 */
export function CreateBottomSheet({ sheetRef }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const snapPoints = useMemo(() => [380 + insets.bottom], [insets.bottom]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.4}
      />
    ),
    [],
  );

  const dismissSheet = () => {
    if (sheetRef && "current" in sheetRef && sheetRef.current) {
      sheetRef.current.dismiss();
    }
  };

  const handleCreateEvent = () => {
    dismissSheet();
    router.push("/(modals)/create-event");
  };

  const handleManageGroups = () => {
    dismissSheet();
    router.push("/groups");
  };

  return (
    <BottomSheetModal
      ref={sheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{
        backgroundColor: colors.neutral.lightest,
        width: 40,
      }}
      backgroundStyle={{
        backgroundColor: colors.surface.DEFAULT,
        borderRadius: 24,
      }}
    >
      <BottomSheetView
        className="flex-1 px-5 pt-2"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
      >
        <TouchableOpacity
          accessibilityRole="button"
          className="flex-row items-center py-4"
          onPress={handleCreateEvent}
          activeOpacity={0.7}
        >
          <View className="mr-4 h-12 w-12 items-center justify-center rounded-2xl">
            <TabIcon
              name="create"
              size={28}
              color={colors.primary.DEFAULT}
              focused={false}
            />
          </View>
          <View className="flex-1">
            <Text className="font-nunito-semibold text-[17px] text-neutral">
              Create Event
            </Text>
            <Text className="mt-0.5 font-nunito text-[12px] text-neutral-light">
              Organize a volunteer event
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityRole="button"
          className="flex-row items-center py-4"
          onPress={handleManageGroups}
          activeOpacity={0.7}
        >
          <View className="mr-4 h-12 w-12 items-center justify-center rounded-2xl">
            <TabIcon
              name="users"
              size={28}
              color={colors.primary.DEFAULT}
              focused={true}
            />
          </View>
          <View className="flex-1">
            <Text className="font-nunito-semibold text-[17px] text-neutral">
              Manage Groups
            </Text>
            <Text className="mt-0.5 font-nunito text-[12px] text-neutral-light">
              View and organize your groups
            </Text>
          </View>
          <View className="mr-4 rounded-md bg-blue-500 px-2 py-1">
            <Text className="font-nunito-semibold text-[11px] tracking-wide text-white">
              NEW
            </Text>
          </View>
        </TouchableOpacity>

        <View className="h-[1px] bg-neutral-lightest" />

        <TouchableOpacity
          accessibilityRole="button"
          className="items-center py-4"
          onPress={dismissSheet}
          activeOpacity={0.7}
        >
          <Text className="font-nunito-semibold text-[17px] text-error">
            Close
          </Text>
        </TouchableOpacity>
      </BottomSheetView>
    </BottomSheetModal>
  );
}
