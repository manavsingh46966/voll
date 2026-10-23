import React from "react";

import { useLocalSearchParams } from "expo-router";

import { ParticipantsScreen } from "@/src/features/events/screens/ParticipantsScreen";

/**
 * Route handler for `/event/:eventId/participants`.
 *
 * @returns {JSX.Element} The event participants screen.
 */
export default function ParticipantsRoute(): React.JSX.Element {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();

  return <ParticipantsScreen eventId={eventId} />;
}
