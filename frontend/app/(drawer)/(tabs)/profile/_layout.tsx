import React from "react";
import { Stack } from "expo-router";

import { colors, fonts } from "@/constants/theme";

/**
 * Isolated Stack Navigator for the Profile tab.
 * Declares all child screens (index, edit, and dynamic [userId]).
 */
export default function ProfileStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.surface.DEFAULT },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="search"
        options={{
          headerShown: true,
          title: "Find People",
          headerTintColor: colors.primary.DEFAULT,
          headerStyle: { backgroundColor: colors.surface.DEFAULT },
          headerTitleStyle: { fontFamily: fonts.bold, fontSize: 18 },
        }}
      />
      <Stack.Screen
        name="edit"
        options={{
          headerShown: true,
          title: "Edit Profile",
          headerTintColor: colors.primary.DEFAULT,
          headerStyle: { backgroundColor: colors.surface.DEFAULT },
          headerTitleStyle: { fontFamily: fonts.bold, fontSize: 18 },
        }}
      />
      <Stack.Screen
        name="[userId]"
        options={{
          headerShown: true,
          title: "Profile",
          headerTintColor: colors.primary.DEFAULT,
          headerStyle: { backgroundColor: colors.surface.DEFAULT },
          headerTitleStyle: { fontFamily: fonts.bold, fontSize: 18 },
        }}
      />
    </Stack>
  );
}
