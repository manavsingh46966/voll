import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Image } from "expo-image";
import { Href, router } from "expo-router";

import { Feather, FontAwesome5, Ionicons } from "@expo/vector-icons";

import type { EventItem } from "../types";
import {
  capitalizeFirst,
  formatDate,
  getLocationString,
} from "../utils/format";

import { ProgressCircle } from "./ProgressCircle";

interface EventCardProps {
  event: EventItem;
}

/**
 * Event Card component replicating the prev_vol card design
 * using NativeWind (Tailwind) classes and the new_vol design system.
 *
 * Displays: category image, title, category, location, author, date,
 * and a circular progress indicator for volunteer capacity.
 * @param root0 - Component props.
 * @param root0.event - The event data to render.
 * @returns {JSX.Element} The rendered event card.
 */
export function EventCard({ event }: EventCardProps) {
  const locationAddress = getLocationString(event.locationAddress);
  const isVirtual = locationAddress.toLowerCase() === "virtual event";
  const authorName = event.createdBy?.name?.trim() ?? "";

  const fallbackImage =
    "https://t4.ftcdn.net/jpg/04/29/64/57/360_F_429645702_EXZw2TFIzZBjegrXvBzg68gzd4aD62kB.jpg";

  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={0.7}
      onPress={() => {
        router.push({
          pathname: "/(drawer)/event/[eventId]",
          params: { eventId: event._id },
        } as Href);
      }}
    >
      <View className="mx-1 my-1.5 flex-col rounded-lg bg-surface p-2">
        {/* ── Header: Image + Title + Category ── */}
        <View className="w-full flex-row items-center">
          <Image
            source={{
              uri: event.categoryIcon || event.photoURL || fallbackImage,
            }}
            contentFit="contain"
            className="h-14 w-16 rounded-lg"
          />
          <View className="ml-3 flex-1 justify-center">
            <Text
              className="font-nunito-bold text-big text-neutral-black"
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {capitalizeFirst(event.title)}
            </Text>
            <Text className="mt-0.5 font-nunito text-small text-neutral-light">
              {event.category ?? ""}
            </Text>
          </View>
        </View>

        {/* ── Body: Details + Progress Circle ── */}
        <View className="mt-2 flex-row">
          {/* Left column: location, author, date */}
          <View className="flex-1 pr-2">
            {/* Location */}
            <View className="flex-row items-center py-0.5">
              <Ionicons
                name="location"
                size={18}
                color={isVirtual ? "#01A39F" : "#8E8E93"}
              />
              <Text
                className={`ml-2 flex-1 font-nunito text-body ${
                  isVirtual ? "text-primary" : "text-neutral-dark"
                }`}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {locationAddress || "No location"}
              </Text>
            </View>

            {/* Author */}
            <View className="flex-row items-center py-0.5">
              <FontAwesome5 name="user-circle" size={16} color="#8E8E93" />
              <Text
                className="ml-2 flex-1 font-nunito text-body text-neutral-dark"
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {authorName || "Unknown"}
              </Text>
            </View>

            {/* Date */}
            <View className="flex-row items-center py-0.5">
              <Feather name="calendar" size={16} color="#8E8E93" />
              <Text
                className="ml-2 flex-1 font-nunito text-body text-neutral-dark"
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {formatDate(event.fromDateTime)}
              </Text>
            </View>
          </View>

          {/* Right column: progress circle */}
          <View className="w-[76px] items-center justify-center">
            <ProgressCircle
              radius={24}
              curr={event.numberOfVolunteers ?? 0}
              total={event.reqMaxVolunteers ?? 0}
              mode={1}
            />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
