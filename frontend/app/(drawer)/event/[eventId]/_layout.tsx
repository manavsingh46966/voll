import { Stack } from "expo-router";

/**
 * Stack layout for all `/event/:eventId/*` sub-routes.
 * Header is hidden; each screen manages its own top bar.
 */
export default function EventDetailLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
