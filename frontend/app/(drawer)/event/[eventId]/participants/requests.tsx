import React from "react";

import { useLocalSearchParams } from "expo-router";

import { JoinRequestsScreen } from "@/src/features/events/screens/JoinRequestsScreen";

/**
 * Route handler for `/event/:eventId/participants/requests`.
 *
 * @returns {JSX.Element} The join requests screen.
 */
export default function JoinRequestsRoute(): React.JSX.Element {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();

  return <JoinRequestsScreen eventId={eventId} />;
}
