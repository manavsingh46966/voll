import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";

import type { Event } from "../types/event.types";

/**
 * Capitalizes the first letter of the given string.
 * If the string is falsy (null, undefined, or empty), it returns an empty string.
 *
 * @param {string} [str] The string to capitalize.
 * @returns {string} The input string with its first letter capitalized, or an empty string.
 */
function capitalizeFirst(str?: string) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Properties expected by the {@link EventCard} component.
 */
interface Props {
  /**
   * The complete {@link Event} data object containing details about the event,
   * such as title, description, cover photo, volunteers count, start date/time, and creator.
   */
  event: Event;
}

/**
 * EventCard is a reusable component that displays a summary card of a volunteer event.
 * Clicking on the card navigates the user to the event's detailed view screen using the router.
 * It shows information including:
 * - Event category/cover image
 * - Capitalized title
 * - Event category name
 * - Location label (resolving virtual or hybrid configurations)
 * - Creator's name
 * - Date and time formatted to the user's locale
 * - Volunteer progress status (number of joined volunteers against the required maximum capacity)
 *
 * @param props The props for the component.
 * @param props.event The event data to render.
 * @returns {React.JSX.Element} A touchable card layout representing the event.
 */
export function EventCard({ event }: Props) {
  const formattedDate = event.fromDateTime
    ? new Date(event.fromDateTime).toLocaleString()
    : "";

  const isVirtual = event.locationType === "virtual";
  const isHybrid = event.locationType === "hybrid";

  let locationString = "";
  if (typeof event.locationAddress === "string") {
    locationString = event.locationAddress;
  } else if (
    event.locationAddress &&
    typeof event.locationAddress === "object"
  ) {
    locationString =
      (event.locationAddress as any).name ||
      (event.locationAddress as any).address ||
      "";
  }
  const locationLabel =
    locationString.trim() || (isVirtual ? "Virtual Event" : "");

  const progress =
    event.reqMaxVolunteers > 0
      ? Math.min(event.numberOfVolunteers / event.reqMaxVolunteers, 1)
      : 0;

  const progressPercent = Math.round(progress * 100);

  return (
    <TouchableOpacity
      accessibilityRole="button"
      className="mx-1 my-2 overflow-hidden rounded-xl bg-surface"
      onPress={() => router.push(`/(drawer)/event/${event._id}` as any)}
      activeOpacity={0.85}
    >
      {event.status === "pending_approval" && (
        <View className="bg-amber-500 px-3 py-1">
          <Text className="font-nunito-semibold text-[11px] text-white">
            ⏳ Pending Approval
          </Text>
        </View>
      )}
      <View className="flex-row items-center p-3">
        <Image
          source={{
            uri:
              event.categoryIcon ||
              event.coverPhotoUrl ||
              "https://t4.ftcdn.net/jpg/04/29/64/57/360_F_429645702_EXZw2TFIzZBjegrXvBzg68gzd4aD62kB.jpg",
          }}
          contentFit="contain"
          className="h-16 w-16 rounded-xl"
        />
        <View className="ml-3 flex-1">
          <Text
            className="font-nunito-bold text-[16px] text-neutral"
            numberOfLines={1}
          >
            {capitalizeFirst(event.title)}
          </Text>
          <Text className="mt-0.5 font-nunito text-[13px] text-neutral-light">
            {event.category || ""}
          </Text>
        </View>
      </View>

      <View className="flex-row items-start justify-between px-3 pb-3">
        <View className="mr-2 flex-1 gap-y-1">
          {!!locationLabel && (
            <View className="flex-row items-center">
              <Text
                className={`font-nunito text-[12px] ${isVirtual || isHybrid ? "text-primary" : "text-neutral-light"}`}
              >
                📍 {locationLabel}
              </Text>
            </View>
          )}
          {event.createdBy?.name ? (
            <Text className="font-nunito text-[12px] text-neutral-light">
              👤 {event.createdBy.name}
            </Text>
          ) : null}
          {!!formattedDate && (
            <Text className="font-nunito text-[12px] text-neutral-light">
              🗓 {formattedDate}
            </Text>
          )}
        </View>

        <View className="w-[68px] items-center justify-center">
          <View
            className={`h-16 w-16 items-center justify-center rounded-full border-4 ${progress > 0 ? "border-primary" : "border-neutral-lightest"}`}
          >
            <Text className="font-nunito-bold text-[11px] text-neutral-light">
              {event.numberOfVolunteers}/{event.reqMaxVolunteers}
            </Text>
          </View>
          <Text className="mt-1 font-nunito text-[11px] text-neutral-light">
            Joined
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
