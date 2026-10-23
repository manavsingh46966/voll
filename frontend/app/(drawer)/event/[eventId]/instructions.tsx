import React from "react";

import { useLocalSearchParams } from "expo-router";

import { InstructionsScreen } from "@/src/features/events/screens/InstructionsScreen";

/**
 * Route handler for `/event/:eventId/instructions`.
 *
 * @returns {JSX.Element} The event instructions screen.
 */
export default function InstructionsRoute(): React.JSX.Element {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();

  return <InstructionsScreen eventId={eventId} />;
}
