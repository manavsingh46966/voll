import React from "react";
import { Pressable, View } from "react-native";
import { router } from "expo-router";

import { colors } from "@/constants/theme";
import { TabIcon } from "@/src/components/icons/TabIcon";
import { useFilterStore } from "@/src/stores/filter.store";
import { useSessionStore } from "@/src/stores/session.store";

import StoriesScreen from "./StoriesScreen";

/**
 * Renders the signed-in user's story dashboard.
 * Displays the user's personal feed and provides a Floating Action Button (FAB)
 * to instantly open the unified story creator modal.
 *
 * @returns {JSX.Element} The "My Story" screen component.
 */
export default function StoriesTabScreen() {
  const { user } = useSessionStore();

  const showOnlyMyStories = useFilterStore((state) => state.showOnlyMyStories);

  return (
    <View className="flex-1">
      {/* 1. Render the generic feed, scoped exclusively to the current user */}
      <StoriesScreen authorId={showOnlyMyStories ? "me" : undefined} />

      {/* 3. Render the Floating Action Button (FAB) only if logged in */}
      {user && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add new story"
          accessibilityHint="Opens the create story modal"
          onPress={() => router.push("/(modals)/story-form")}
          className="absolute bottom-4 right-6 h-16 w-16 items-center justify-center rounded-full bg-surface-yellow shadow-lg"
          style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
        >
          <TabIcon
            name="plus"
            size={32}
            color={colors.neutral.white}
            focused={true}
          />
        </Pressable>
      )}
    </View>
  );
}
