import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

import { MaterialIcons, SimpleLineIcons } from "@expo/vector-icons";

import type { EventItem } from "../types";
import { getLocationString } from "../utils/format";

interface EventInfoSectionProps {
  event: EventItem;
}

/**
 * Displays core event information matching the prev_vol design:
 * title, category, location row, divider, organizer row with
 * "View Profile" link, divider, date range (multi-line from/to).
 *
 * @param root0 - Component props.
 * @param root0.event - The full event data object.
 * @returns {JSX.Element} The rendered info section.
 */
export function EventInfoSection({
  event,
}: EventInfoSectionProps): React.JSX.Element {
  const location = getLocationString(event.locationAddress);
  const isVirtual = location.toLowerCase() === "virtual event";
  const authorName = event.createdBy?.name?.trim() ?? "User";

  return (
    <View>
      {/* Title + Category */}
      <View className="my-6 px-4">
        <Text className="font-nunito-bold text-[24px] text-neutral-black">
          {event.title || "Untitled Event"}
        </Text>
        <Text className="font-nunito text-[16px] text-neutral-light">
          {event.category || ""}
        </Text>
      </View>

      <View className="ml-4">
        {/* Location */}
        <View className="my-2 flex-row items-center">
          {isVirtual ? (
            <>
              <MaterialIcons name="sensors" size={20} color="#00A4B4" />
              <Text className="ml-2 font-nunito-semibold text-[16px] text-primary">
                Virtual Event
              </Text>
            </>
          ) : (
            <>
              <SimpleLineIcons
                name="location-pin"
                size={20}
                color="gray"
                accessibilityLabel="Location"
              />
              <Text
                className="ml-2 pr-10 font-nunito text-[16px] text-neutral-dark"
                numberOfLines={3}
              >
                {location || "Location not specified"}
              </Text>
            </>
          )}
        </View>

        {/* Divider */}
        <View className="h-[2px] bg-neutral-lightest" />

        {/* Organizer */}
        <View className="my-2 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <MaterialIcons
              name="person-outline"
              size={20}
              color="gray"
              accessibilityLabel="Organizer"
            />
            <Text className="ml-2 font-nunito text-[16px] text-neutral-dark">
              {authorName}
            </Text>
          </View>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="View organizer profile"
            className="h-11 justify-center"
          >
            <Text className="px-3 font-nunito-bold text-[16px] text-primary">
              View Profile
            </Text>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View className="h-[2px] bg-neutral-lightest" />

        {/* Date Range */}
        <View className="my-2 flex-row items-start">
          <MaterialIcons
            name="today"
            size={20}
            color="gray"
            accessibilityLabel="Event date"
            style={{ marginTop: 4 }}
          />
          <View className="ml-2 flex-col">
            {event.fromDateTime && event.toDateTime ? (
              <>
                <Text className="font-nunito text-[16px] text-neutral-dark">
                  {formatDateLine(event.fromDateTime)}
                </Text>
                <Text className="font-nunito text-[16px] text-neutral-dark">
                  To
                </Text>
                <Text className="font-nunito text-[16px] text-neutral-dark">
                  {formatDateLine(event.toDateTime)}
                </Text>
              </>
            ) : (
              <Text className="font-nunito text-[16px] text-neutral-dark">
                Date not specified
              </Text>
            )}
          </View>
        </View>

        {/* Divider */}
        <View className="h-[2px] bg-neutral-lightest" />
      </View>
    </View>
  );
}

/**
 * Format an ISO date string into the prev_vol display format:
 * "23 Feb 2026, 10:00 AM".
 *
 * @param dateStr - ISO date string.
 * @returns The formatted date line.
 */
function formatDateLine(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getDate();
  const month = d.toLocaleDateString("en-US", { month: "short" });
  const year = d.getFullYear();
  const time = d.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${day} ${month} ${year}, ${time}`;
}
