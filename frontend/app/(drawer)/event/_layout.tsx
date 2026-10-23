import { Stack } from "expo-router";

/**
 * Layout for all `/event/*` sub-routes inside the Drawer.
 * Groups [eventId]/ detail screens and join/ flow.
 */
export default function EventLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
