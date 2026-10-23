import React from "react";

import { useLocalSearchParams } from "expo-router";
import { Drawer } from "expo-router/drawer";

import { JoinEventScreen } from "@/src/features/events/screens/JoinEventScreen";

/**
 * Thin route wrapper for the join event screen.
 * Reads the dynamic `eventId` param and delegates to the feature screen.
 *
 * @returns {JSX.Element} The join event screen.
 */
export default function JoinEventRoute(): React.JSX.Element {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  return (
    <>
      <Drawer.Screen
        options={{
          headerShown: false,
          drawerItemStyle: { display: "none" },
        }}
      />
      <JoinEventScreen eventId={eventId} />
    </>
  );
}
