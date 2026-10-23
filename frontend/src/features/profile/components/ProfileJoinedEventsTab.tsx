import React from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Href, router } from "expo-router";

import { Ionicons, MaterialIcons } from "@expo/vector-icons";

import { colors } from "@/constants/theme";
import { useEvents } from "@/src/features/events/hooks/useEvents";
import type { EventItem } from "@/src/features/events/types";

interface Props {
  userId?: string;
  isOwner?: boolean;
}

export function ProfileJoinedEventsTab({ isOwner = true }: Props) {
  const { data, isLoading, isError, refetch } = useEvents({
    joinedOnly: true,
  });

  const events: EventItem[] = data?.pages.flat() ?? [];

  if (isLoading) {
    return (
      <View className="items-center justify-center py-12">
        <ActivityIndicator size="small" color={colors.primary.DEFAULT} />
        <Text className="mt-3 font-nunito text-xs text-neutral-light">
          Loading joined events...
        </Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View className="items-center justify-center px-6 py-10">
        <Text className="text-center font-nunito text-sm text-neutral-light">
          Unable to load events.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => refetch()}
          className="mt-3 rounded-xl bg-primary/10 px-4 py-2"
        >
          <Text className="font-nunito-bold text-xs text-primary">Retry</Text>
        </Pressable>
      </View>
    );
  }

  if (events.length === 0) {
    return (
      <View className="items-center justify-center px-6 py-12">
        <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl bg-teal-50">
          <Ionicons name="calendar-outline" size={32} color={colors.primary.DEFAULT} />
        </View>
        <Text className="font-nunito-bold text-base text-neutral-black">
          {isOwner ? "No Joined Events Yet" : "No Events Joined"}
        </Text>
        <Text className="mt-1 text-center font-nunito text-xs text-neutral-light">
          {isOwner
            ? "You haven't joined any volunteer events yet. Explore events and make a difference!"
            : "This user has not joined any volunteer events yet."}
        </Text>

        {isOwner && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Explore Events"
            onPress={() => router.push("/(drawer)/(tabs)/home" as unknown as Href)}
            className="mt-5 flex-row items-center rounded-xl bg-primary px-5 py-3 shadow-sm"
          >
            <Ionicons name="compass-outline" size={18} color="white" />
            <Text className="ml-2 font-nunito-bold text-sm text-white">
              Explore Events
            </Text>
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <View className="px-4 pt-3">
      {events.map((event) => {
        const dateStr = event.fromDateTime
          ? new Date(event.fromDateTime).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "Upcoming";

        const locationText =
          typeof event.locationAddress === "object"
            ? event.locationAddress?.name || event.locationAddress?.address || "Location specified"
            : typeof event.locationAddress === "string"
              ? event.locationAddress
              : "Location specified";

        return (
          <Pressable
            key={event._id}
            accessibilityRole="button"
            accessibilityLabel={`Event: ${event.title}`}
            onPress={() =>
              router.push(`/(drawer)/event/${event._id}` as unknown as Href)
            }
            className="mb-3 overflow-hidden rounded-2xl border border-neutral-lightest bg-white p-3.5 shadow-sm active:opacity-95"
          >
            <View className="flex-row">
              {/* Event Image / Placeholder */}
              <View className="mr-3 h-20 w-20 overflow-hidden rounded-xl bg-neutral-lightest">
                {event.photoURL ? (
                  <Image
                    source={{ uri: event.photoURL }}
                    contentFit="cover"
                    className="h-full w-full"
                  />
                ) : (
                  <View className="h-full w-full items-center justify-center bg-teal-50">
                    <Ionicons
                      name="hand-left"
                      size={24}
                      color={colors.primary.DEFAULT}
                    />
                  </View>
                )}
              </View>

              {/* Event Info */}
              <View className="flex-1 justify-between">
                <View>
                  <View className="flex-row items-center justify-between">
                    <View className="rounded-md bg-teal-50 px-2 py-0.5">
                      <Text className="font-nunito-bold text-[10px] uppercase text-primary">
                        {event.category || "Volunteering"}
                      </Text>
                    </View>
                    <View className="rounded-md bg-emerald-50 px-2 py-0.5">
                      <Text className="font-nunito-bold text-[10px] text-emerald-700">
                        {event.isPending ? "Pending" : "Joined"}
                      </Text>
                    </View>
                  </View>

                  <Text
                    className="mt-1 font-nunito-bold text-sm text-neutral-black"
                    numberOfLines={2}
                  >
                    {event.title}
                  </Text>
                </View>

                <View className="mt-2 flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Ionicons name="time-outline" size={13} color="#6B7280" />
                    <Text className="ml-1 font-nunito text-xs text-neutral-gray">
                      {dateStr}
                    </Text>
                  </View>

                  <View className="flex-row items-center">
                    <Ionicons
                      name="location-outline"
                      size={13}
                      color="#6B7280"
                    />
                    <Text
                      className="ml-1 max-w-[120px] font-nunito text-xs text-neutral-gray"
                      numberOfLines={1}
                    >
                      {locationText}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
