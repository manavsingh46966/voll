import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { router } from "expo-router";

import { MaterialIcons } from "@expo/vector-icons";

import { useEventDetails } from "../hooks/useEventDetails";
import {
  useEventWaitingList,
  useHandleJoinRequest,
} from "../hooks/useEventParticipants";
import type { WaitingUser } from "../types";

const FALLBACK_AVATAR =
  "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

interface JoinRequestsScreenProps {
  eventId: string;
}

/**
 * Join Requests screen showing pending volunteers waiting for organizer approval.
 * Organizers can confirm or delete each request.
 *
 * @param root0 - Component props.
 * @param root0.eventId - The numeric event identifier.
 * @returns {JSX.Element} The rendered join requests screen.
 */
export function JoinRequestsScreen({
  eventId,
}: JoinRequestsScreenProps): React.JSX.Element {
  const { data: event } = useEventDetails(eventId);
  const { data: waitingData, isLoading } = useEventWaitingList(eventId);
  const handleMutation = useHandleJoinRequest(eventId);

  const [processingId, setProcessingId] = useState<string | null>(null);

  const waitingUsers = waitingData?.result ?? [];
  const evId = event?._id ?? "";

  const handleAccept = (participant: WaitingUser) => {
    if (processingId !== null) return;
    setProcessingId(participant._id);
    handleMutation.mutate(
      {
        eventId,
        userId: participant._id,
        action: "accept",
      },
      {
        onSettled: () => setProcessingId(null),
        onError: () =>
          Alert.alert("Error", "Failed to accept request. Please try again."),
      },
    );
  };

  const handleReject = (participant: WaitingUser) => {
    if (processingId !== null) return;
    setProcessingId(participant._id);
    handleMutation.mutate(
      {
        eventId,
        userId: participant._id,
        action: "reject",
      },
      {
        onSettled: () => setProcessingId(null),
        onError: () =>
          Alert.alert("Error", "Failed to reject request. Please try again."),
      },
    );
  };

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
          Joining Requests
        </Text>
        <View className="w-11" />
      </View>

      <ScrollView className="flex-1">
        {isLoading ? (
          <View className="items-center py-10">
            <ActivityIndicator size="large" color="#01A39F" />
          </View>
        ) : waitingUsers.length === 0 ? (
          <View className="flex-1 items-center justify-center py-10">
            <Text className="px-6 text-center font-nunito text-[14px] text-neutral-light">
              No pending join requests.
            </Text>
          </View>
        ) : (
          waitingUsers.map((participant) => (
            <RequestRow
              key={participant._id}
              participant={participant}
              isProcessing={processingId === participant._id}
              onAccept={() => handleAccept(participant)}
              onReject={() => handleReject(participant)}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ── Private sub-components ───────────────────────── */

interface RequestRowProps {
  participant: WaitingUser;
  isProcessing: boolean;
  onAccept: () => void;
  onReject: () => void;
}

function RequestRow({
  participant,
  isProcessing,
  onAccept,
  onReject,
}: RequestRowProps): React.JSX.Element {
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

        {/* Actions */}
        <View className="flex-row gap-1">
          <TouchableOpacity
            accessibilityRole="button"
            onPress={onAccept}
            disabled={isProcessing}
            className={`items-center justify-center rounded-lg px-3 py-2 ${
              isProcessing ? "bg-neutral-lightest" : "bg-primary"
            }`}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#01A39F" />
            ) : (
              <Text className="font-nunito-semibold text-[13px] text-white">
                Confirm
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={onReject}
            disabled={isProcessing}
            className="items-center justify-center px-3 py-2"
          >
            <Text className="font-nunito text-[13px] text-neutral-dark">
              Delete
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <View className="h-[1px] bg-neutral-lightest" />
    </View>
  );
}
