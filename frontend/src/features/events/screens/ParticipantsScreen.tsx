import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { router } from "expo-router";

import { Feather, MaterialIcons } from "@expo/vector-icons";

import { useAuthStore } from "@/src/features/auth/stores/auth.store";

import { useEventDetails } from "../hooks/useEventDetails";
import { useEventParticipants } from "../hooks/useEventParticipants";
import type { Participant } from "../types";

const FALLBACK_AVATAR =
  "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

interface ParticipantsScreenProps {
  eventId: string;
}

/**
 * Participants screen for a specific event.
 * Shows registered volunteers; organizer sees a "Join Requests" entry and can manage.
 *
 * @param root0 - Component props.
 * @param root0.eventId - The numeric event identifier.
 * @returns {JSX.Element} The rendered participants screen.
 */
export function ParticipantsScreen({
  eventId,
}: ParticipantsScreenProps): React.JSX.Element {
  const user = useAuthStore((s) => s.user);
  const { data: event } = useEventDetails(eventId);
  const { data: participantsData, isLoading } = useEventParticipants(eventId);

  const [searchQuery, setSearchQuery] = useState("");

  const isOrganizer =
    !!event?.createdBy &&
    String(event.createdBy.userId) === String(user?.userId);

  const allParticipants = useMemo<Participant[]>(
    () => [
      ...(participantsData?.registeredUsers ?? []),
      ...(participantsData?.interestedUsers ?? []),
    ],
    [participantsData],
  );

  const filteredParticipants = useMemo(() => {
    if (!searchQuery.trim()) return allParticipants;
    const q = searchQuery.toLowerCase();
    return allParticipants.filter((p) => p.name?.toLowerCase().includes(q));
  }, [allParticipants, searchQuery]);

  const showJoinRequests = isOrganizer && event?.allowJoiningRequests === true;

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
      {/* Top bar */}
      <View className="flex-row items-center justify-between px-4 pb-2 pt-4">
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-11 w-11 items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel="Go back"
          accessibilityHint="Returns to the event details"
        >
          <MaterialIcons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text className="font-nunito-bold text-[18px] text-neutral-black">
          Participants
        </Text>
        <View className="w-11" />
      </View>

      <ScrollView className="flex-1">
        {/* Join Requests shortcut (organizer only) */}
        {showJoinRequests && (
          <TouchableOpacity
            accessibilityRole="button"
            className="mx-4 mt-3 flex-row items-center justify-between rounded-xl border border-neutral-lightest bg-surface-gray px-4 py-3"
            onPress={() =>
              router.push(
                `/(drawer)/event/${eventId}/participants/requests` as never,
              )
            }
          >
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-primary">
                <MaterialIcons name="person-add" size={20} color="white" />
              </View>
              <Text className="font-nunito-semibold text-[15px] text-neutral-black">
                Joining Requests
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color="#8E8E93" />
          </TouchableOpacity>
        )}

        {/* Search bar */}
        <View className="mx-4 mt-3 flex-row items-center gap-2 rounded-lg border border-neutral-lightest bg-surface-gray px-3 py-2">
          <Feather name="search" size={20} color="#8E8E93" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search participants..."
            accessibilityLabel="Search participants"
            accessibilityHint="Filters the participant list by name"
            placeholderTextColor="#8E8E93"
            className="flex-1 font-nunito text-[15px] text-neutral-black"
          />
        </View>

        {/* Participant count */}
        <Text className="mt-3 px-4 font-nunito text-[13px] text-neutral-light">
          {allParticipants.length}{" "}
          {allParticipants.length === 1 ? "Volunteer" : "Volunteers"}
        </Text>

        {/* List */}
        {isLoading ? (
          <View className="items-center py-10">
            <ActivityIndicator size="large" color="#01A39F" />
          </View>
        ) : filteredParticipants.length === 0 ? (
          <View className="items-center py-10">
            <Text className="px-6 text-center font-nunito text-[14px] text-neutral-light">
              {searchQuery
                ? "No participants match your search."
                : "No participants yet."}
            </Text>
          </View>
        ) : (
          filteredParticipants.map((participant, index) => (
            <ParticipantRow
              key={participant._id ?? index}
              participant={participant}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ── Private sub-components ───────────────────────── */

interface ParticipantRowProps {
  participant: Participant;
}

function ParticipantRow({
  participant,
}: ParticipantRowProps): React.JSX.Element {
  return (
    <View>
      <View className="flex-row items-center justify-between px-4 py-3">
        <View className="flex-row items-center gap-3">
          <Image
            source={{ uri: participant.profileImageUrl || FALLBACK_AVATAR }}
            style={{ height: 52, width: 52, borderRadius: 26 }}
            contentFit="cover"
          />
          <View>
            <Text className="font-nunito-bold text-[15px] text-neutral-black">
              {participant.name ?? "Volunteer"}
            </Text>
            {participant.slotTitle && (
              <Text className="font-nunito text-[13px] text-neutral-light">
                Time Slot:{" "}
                <Text className="text-neutral-dark">
                  {participant.slotTitle}
                </Text>
              </Text>
            )}
            {participant.location && (
              <Text className="font-nunito text-[13px] text-neutral-light">
                {participant.location}
              </Text>
            )}
          </View>
        </View>
      </View>
      <View className="h-[1px] bg-neutral-lightest" />
    </View>
  );
}
