import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Href, router } from "expo-router";

import type { EventItem } from "../types";

interface JoinEventButtonProps {
  /** The full event data. */
  event: EventItem;
}

/**
 * Action button displayed on the event details screen.
 * Shows one of four states: "Joining period ended", "Event is full",
 * "Requested" (pending), "Joined" (with check icon), or "Join Event"
 * (navigates to the join screen). Matches prev_vol design exactly.
 *
 * @param root0 - Component props.
 * @param root0.event - The event data including relationship flags.
 * @returns {JSX.Element} The rendered join button or status indicator.
 */
export function JoinEventButton({
  event,
}: JoinEventButtonProps): React.JSX.Element {
  const isJoined = event.isJoined ?? false;
  const isPending = event.isPending ?? false;
  const registeredCount = event.numberOfVolunteers ?? 0;
  const maxVolunteers = event.reqMaxVolunteers ?? 0;
  const isFull = maxVolunteers > 0 && registeredCount >= maxVolunteers;

  const isJoiningClosed = event.lastDateOfJoining
    ? new Date(event.lastDateOfJoining) < new Date()
    : false;

  /* Joining period ended */
  if (isJoiningClosed && !isJoined) {
    return (
      <View className="mx-4 mb-4 mt-9 flex-row items-center justify-center rounded-md bg-neutral-light py-3">
        <Text className="text-xl font-semibold text-white">
          Joining period ended
        </Text>
      </View>
    );
  }

  /* Event is full */
  if (isFull && !isJoined) {
    return (
      <View className="mx-4 mb-4 mt-9 flex-row items-center justify-center rounded-md bg-neutral-light py-3">
        <Text className="text-xl font-semibold text-white">
          Event is full
        </Text>
      </View>
    );
  }

  /* Join / Requested / Joined */
  return (
    <TouchableOpacity
      className="mx-4 mb-4 mt-9 flex-row items-center justify-center rounded-md bg-primary"
      onPress={() =>
        router.push(
          `/(drawer)/event/join/${event._id}` as unknown as Href,
        )
      }
      disabled={isPending || isJoined}
    >
      {isPending ? (
        <Text className="py-2 text-xl font-semibold text-white">
          Requested
        </Text>
      ) : !isJoined ? (
        <Text className="py-2 text-xl font-semibold text-white">
          Join Event
        </Text>
      ) : (
        <View className="flex-row items-center gap-2">
          <MaterialCommunityIcons
            name="checkbox-marked-circle-outline"
            size={24}
            color="white"
          />
          <Text className="py-2 text-xl font-semibold text-white">
            Joined
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
