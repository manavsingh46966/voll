import React from "react";

import { useLocalSearchParams } from "expo-router";

import { EventDetailsScreen } from "@/src/features/events/screens/EventDetailsScreen";

/**
 * Route entry for /(drawer)/(tabs)/events/[id].
 * Delegates to the fully-designed EventDetailsScreen.
 */
export default function EventDetailRoute(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <EventDetailsScreen eventId={id ?? ""} />;
}
