import React from "react";
import { useLocalSearchParams } from "expo-router";

import UserProfileScreen from "@/src/features/profile/screens/UserProfileScreen";

/**
 * **Dynamic User Profile Route**
 * Route: /(drawer)/(tabs)/profile/[userId]
 *
 * Renders the public profile of any user identified by the `userId` route param.
 *
 * @returns {JSX.Element}
 */
export default function UserProfileRoute() {
  const { userId } = useLocalSearchParams<{ userId: string }>();

  if (!userId) return null;

  return <UserProfileScreen userId={userId} />;
}
