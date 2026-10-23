import React from "react";

import { useLocalSearchParams } from "expo-router";

import { QnaScreen } from "@/src/features/events/screens/QnaScreen";

/**
 * Route handler for `/event/:eventId/qna`.
 *
 * @returns {JSX.Element} The event Q&A screen.
 */
export default function QnaRoute(): React.JSX.Element {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();

  return <QnaScreen eventId={eventId} />;
}
