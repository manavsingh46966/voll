import React from "react";
import { Stack } from "expo-router";

/**
 * Isolated Stack Navigator for this specific tab.
 * By wrapping the tab in its own Stack, it maintains its own independent
 * navigation history separate from the other tabs.
 * * @returns {JSX.Element} The stack navigator.
 */
export default function TabStackLayout() {
  return (
    <Stack
      screenOptions={{
        // We hide the header here because the parent Tabs layout
        // is already providing the CustomHeader.
        headerShown: false,
      }}
    />
  );
}
