import React, { useRef, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, Tabs } from "expo-router";

import { BottomSheetModal } from "@gorhom/bottom-sheet";

import { colors, fonts } from "@/constants/theme";
import { TabIcon } from "@/src/components/icons/TabIcon";
import { CreateBottomSheet } from "@/src/components/navigation/CreateBottomSheet";
import { CustomHeader } from "@/src/components/navigation/CustomHeader";
import { ActionModal } from "@/src/components/ui/ActionModal";
import { useSessionStore } from "@/src/stores/session.store";

/**
 *
 */
export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { user } = useSessionStore();
  const [showAuthWall, setShowAuthWall] = useState(false);
  const createSheetRef = useRef<BottomSheetModal>(null);

  const requireAuth = (event: { preventDefault: () => void }) => {
    if (!user) {
      event.preventDefault();
      setShowAuthWall(true);
    }
  };

  const handleCreateTabPress = (event: { preventDefault: () => void }) => {
    event.preventDefault();
    if (!user) {
      setShowAuthWall(true);
      return;
    }
    console.log("Sheet Ref Exists?", !!createSheetRef.current); // Should print 'true'
    createSheetRef.current?.present();
  };

  return (
    <>
      <ActionModal
        visible={showAuthWall}
        title="Login Required"
        message="Please log in or create an account to access this feature."
        actionLabel="Go to Login"
        onAction={() => {
          setShowAuthWall(false);
          router.push("/(auth)/login");
        }}
        secondaryLabel="Cancel"
        onSecondary={() => setShowAuthWall(false)}
      />

      <Tabs
        backBehavior="history"
        screenOptions={{
          header: () => <CustomHeader />,
          tabBarStyle: {
            backgroundColor: colors.surface.DEFAULT,
            borderTopColor: colors.neutral.lightest,
            borderTopWidth: 1,
            height: 60 + insets.bottom,
            paddingBottom: insets.bottom > 0 ? insets.bottom + 5 : 10,
            paddingTop: 10,
          },
          tabBarActiveTintColor: colors.primary.DEFAULT,
          tabBarInactiveTintColor: colors.neutral.light,
          tabBarShowLabel: true,
          tabBarLabelStyle: {
            fontFamily: fonts.bold,
            fontSize: 10,
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: "Home",
            tabBarIcon: ({ color, focused }) => (
              <TabIcon name="home" color={color} focused={focused} />
            ),
          }}
        />

        <Tabs.Screen
          name="stories"
          options={{
            title: "Stories",
            tabBarIcon: ({ color, focused }) => (
              <TabIcon name="stories" color={color} focused={focused} />
            ),
          }}
        />

        <Tabs.Screen
          name="create"
          listeners={{ tabPress: handleCreateTabPress }}
          options={{
            title: "Create",
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                name="create"
                color={color}
                size={30}
                focused={focused}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="notifications"
          listeners={{ tabPress: requireAuth }}
          options={{
            title: "Notifications",
            tabBarIcon: ({ color, focused }) => (
              <TabIcon name="notifications" color={color} focused={focused} />
            ),
          }}
        />

        <Tabs.Screen
          name="profile"
          listeners={{ tabPress: requireAuth }}
          options={{
            title: "Profile",
            tabBarIcon: ({ color, focused }) => (
              <TabIcon name="profile" color={color} focused={focused} />
            ),
          }}
        />

        <Tabs.Screen name="events/[id]" options={{ href: null }} />
        <Tabs.Screen
          name="story/[author]"
          options={{ href: null, headerShown: false }}
        />
      </Tabs>

      <CreateBottomSheet sheetRef={createSheetRef} />
    </>
  );
}
