import React, { useMemo } from "react";
import { Image, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
  DrawerItemList,
} from "@react-navigation/drawer";

import { colors } from "@/constants/theme";
import { TabIcon } from "@/src/components/icons/TabIcon";
import { useSessionStore } from "@/src/stores/session.store";

/**
 * **Custom Navigation Sidebar**
 *
 * This component replaces the default drawer content to provide a branded
 * user experience. It features a custom header section with user profile details
 * and renders the standard navigation links below it.
 *
 * **Key Features:**
 * - **Dynamic Header:** Adjusts padding based on device safe area insets.
 * - **User Profile:** Displays the current user's avatar, name, and email from the Auth Store.
 * - **Standard Navigation:** Wraps `DrawerItemList` to maintain standard navigation functionality.
 *
 * @component
 * @param {DrawerContentComponentProps} props - Props passed by the React Navigation Drawer navigator.
 * @returns {JSX.Element} The rendered custom sidebar with profile header and navigation list.
 */
export default function CustomSidebar(props: DrawerContentComponentProps) {
  const { user } = useSessionStore();
  const insets = useSafeAreaInsets();
  const headerStyle = useMemo(
    () => ({ paddingTop: insets.top + 20 }),
    [insets.top],
  );

  return (
    <View className="flex-1 bg-primary">
      {/* 1. HEADER SECTION */}
      <View
        className="bg-primary px-4 pb-8"
        // DYNAMIC TOP PADDING: Text starts exactly below Status Bar
        style={headerStyle}
      >
        {/* Profile Image */}
        <View className="mb-3 h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-neutral-white bg-surface/20">
          {user?.profileImageUrl ? (
            <Image
              source={{ uri: user.profileImageUrl }}
              className="h-full w-full"
            />
          ) : (
            <TabIcon name="person" size={40} color={colors.neutral.white} />
          )}
        </View>

        {/* User Info */}
        <Text className="font-nunito-bold text-lg text-neutral-white">
          {user?.name || "Volstory User"}
        </Text>
        <Text className="font-nunito text-sm text-neutral-white/80">
          {user?.email || "user@volstory.com"}
        </Text>
      </View>

      {/* 2. DRAWER ITEMS (The List) */}
      <View className="flex-1 bg-surface">
        {/* ^^^ Reset BG to white for the list */}
        <DrawerContentScrollView {...props} contentContainerClassName="pt-2.5">
          <DrawerItemList {...props} />
        </DrawerContentScrollView>
      </View>
    </View>
  );
}
