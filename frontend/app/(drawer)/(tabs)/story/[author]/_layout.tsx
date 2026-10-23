import React from "react";
import { Stack } from "expo-router";

import { CustomHeader } from "@/src/components/navigation/CustomHeader";

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
        header: () => <CustomHeader showBackButton={true} />,
      }}
    />
  );
}
