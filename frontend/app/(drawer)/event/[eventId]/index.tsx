import React from "react";

import { useLocalSearchParams } from "expo-router";

import { EventDetailsScreen } from "@/src/features/events/screens/EventDetailsScreen";

/**
 * Route handler for `/event/:eventId`.
 * Reads the dynamic segment from the URL and delegates
 * rendering to the feature-level `EventDetailsScreen`.
 *
 * @returns {JSX.Element} The event details screen for the given eventId.
 */
export default function EventDetailsRoute(): React.JSX.Element {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();

  return <EventDetailsScreen eventId={eventId} />;
}
