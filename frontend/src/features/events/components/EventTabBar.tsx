import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

import { Href, router, usePathname } from "expo-router";

interface TabItem {
  label: string;
  route: string;
}

interface EventTabBarProps {
  eventId: string;
  /** Whether the current user has joined the event or is the organizer. */
  hasAccess: boolean;
}

const DETAILS_TABS: TabItem[] = [
  { label: "Details", route: "" },
  { label: "Q&A", route: "/qna" },
];

const FULL_TABS: TabItem[] = [
  { label: "Details", route: "" },
  { label: "Instructions", route: "/instructions" },
  { label: "Q&A", route: "/qna" },
];

/**
 * Horizontal tab bar for event detail screens.
 * Shows "Details" only for non-members; shows all three tabs for
 * joined users and organizers. Highlights the active tab based on pathname.
 *
 * @param root0 - Component props.
 * @param root0.eventId - Numeric event identifier.
 * @param root0.hasAccess - Whether to show Instructions and Q&A tabs.
 * @returns {JSX.Element} The rendered tab bar.
 */
export function EventTabBar({
  eventId,
  hasAccess,
}: EventTabBarProps): React.JSX.Element {
  const pathname = usePathname();
  const tabs = hasAccess ? FULL_TABS : DETAILS_TABS;
  const base = `/(drawer)/event/${eventId}`;

  return (
    <View className="flex-row border-b border-neutral-lightest bg-surface">
      {tabs.map((tab) => {
        const fullRoute = `${base}${tab.route}`;
        // Determine active: exact match for details (no suffix), suffix match otherwise
        const isActive = tab.route === ""
          ? pathname === `/event/${eventId}`
          : pathname.endsWith(tab.route);

        return (
          <TouchableOpacity
            key={tab.label}
            className="flex-1 items-center py-3"
            onPress={() => router.push(fullRoute as unknown as Href)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            <Text
              className={
                isActive
                  ? "font-nunito-bold text-[15px] text-primary"
                  : "font-nunito text-[15px] text-neutral-light"
              }
            >
              {tab.label}
            </Text>
            {isActive && (
              <View className="mt-2 h-[2px] w-full bg-primary" />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
