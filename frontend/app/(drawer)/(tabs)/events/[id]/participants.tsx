import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";

import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { colors } from "@/constants/theme";
import {
  approveRequestApi,
  fetchParticipantsApi,
  fetchPendingRequestsApi,
  rejectRequestApi,
} from "@/src/features/createEvent/api/event.api";
import type { Person } from "@/src/features/createEvent/types/event.types";

const FALLBACK_AVATAR =
  "https://th.bing.com/th/id/OIP.rmim2jYzNpSCslo60INohQHaF9?w=246&h=198&c=7&r=0&o=5&pid=1.7";

function ParticipantRow({ person }: { person: Person }) {
  return (
    <View className="flex-row items-center border-b border-neutral-lightest px-4 py-3">
      <Image
        source={{ uri: (person as any).profileImageUrl || FALLBACK_AVATAR }}
        className="h-10 w-10 rounded-full"
        contentFit="cover"
      />
      <View className="ml-3 flex-1">
        <Text className="font-nunito-semibold text-[15px] text-neutral">
          {(person as any).name || "Volunteer"}
        </Text>
        {!!person.email && (
          <Text className="font-nunito text-[12px] text-neutral-light">
            {person.email}
          </Text>
        )}
      </View>
      <Ionicons
        name="checkmark-circle"
        size={20}
        color={colors.primary.DEFAULT}
      />
    </View>
  );
}

function RequestRow({
  person,
  eventId,
  onAction,
}: {
  person: Person;
  eventId: string;
  onAction: () => void;
}) {
  const queryClient = useQueryClient();

  const approveMutation = useMutation({
    mutationFn: () => approveRequestApi(eventId, person._id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["event-participants", eventId],
      });
      queryClient.invalidateQueries({ queryKey: ["event-requests", eventId] });
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      onAction();
    },
    onError: () => Alert.alert("Error", "Could not approve request."),
  });

  const rejectMutation = useMutation({
    mutationFn: () => rejectRequestApi(eventId, person._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-requests", eventId] });
      onAction();
    },
    onError: () => Alert.alert("Error", "Could not reject request."),
  });

  const isPending = approveMutation.isPending || rejectMutation.isPending;

  return (
    <View className="flex-row items-center border-b border-neutral-lightest px-4 py-3">
      <Image
        source={{ uri: (person as any).profileImageUrl || FALLBACK_AVATAR }}
        className="h-10 w-10 rounded-full"
        contentFit="cover"
      />
      <View className="ml-3 flex-1">
        <Text className="font-nunito-semibold text-[15px] text-neutral">
          {(person as any).name || "Volunteer"}
        </Text>
        {!!person.email && (
          <Text className="font-nunito text-[12px] text-neutral-light">
            {person.email}
          </Text>
        )}
      </View>
      {isPending ? (
        <ActivityIndicator size="small" color={colors.primary.DEFAULT} />
      ) : (
        <View className="flex-row gap-x-2">
          <TouchableOpacity
            accessibilityRole="button"
            className="rounded-lg bg-primary px-3 py-1.5"
            onPress={() => approveMutation.mutate()}
          >
            <Text className="font-nunito-semibold text-[13px] text-white">
              Approve
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            className="rounded-lg border border-neutral-lightest px-3 py-1.5"
            onPress={() => rejectMutation.mutate()}
          >
            <Text className="font-nunito-semibold text-[13px] text-neutral-light">
              Reject
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

/**
 *
 */
export default function ParticipantsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [showRequests, setShowRequests] = useState(false);

  const { data: participants = [], isLoading: loadingParticipants } = useQuery<
    Person[]
  >({
    queryKey: ["event-participants", id],
    queryFn: () => fetchParticipantsApi(id!),
    enabled: !!id,
  });

  const {
    data: requests = [],
    isLoading: loadingRequests,
    refetch: refetchRequests,
  } = useQuery<Person[]>({
    queryKey: ["event-requests", id],
    queryFn: () => fetchPendingRequestsApi(id!),
    enabled: !!id,
  });

  const isLoading = loadingParticipants || loadingRequests;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center border-b border-neutral-lightest px-4 py-3">
        <TouchableOpacity
          accessibilityRole="button"
          className="h-9 w-9 items-center justify-center"
          onPress={() => router.back()}
        >
          <Ionicons
            name="chevron-back"
            size={24}
            color={colors.neutral.DEFAULT}
          />
        </TouchableOpacity>
        <Text className="flex-1 text-center font-nunito-bold text-[17px] text-neutral">
          Participants
        </Text>
        <View className="w-9" />
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
        </View>
      ) : (
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {requests.length > 0 && (
            <TouchableOpacity
              accessibilityRole="button"
              className="flex-row items-center border-b border-neutral-lightest bg-neutral-lightest px-4 py-4"
              onPress={() => setShowRequests(!showRequests)}
              activeOpacity={0.8}
            >
              <View className="relative mr-3">
                <Image
                  source={{
                    uri:
                      (requests[0] as any).profileImageUrl || FALLBACK_AVATAR,
                  }}
                  className="h-12 w-12 rounded-full"
                  contentFit="cover"
                />
                <View className="absolute -right-1 -top-1 h-[18px] min-w-[18px] items-center justify-center rounded-full bg-error px-1">
                  <Text className="font-nunito-bold text-[11px] text-white">
                    {requests.length}
                  </Text>
                </View>
              </View>
              <View className="flex-1">
                <Text className="font-nunito-bold text-[15px] text-neutral">
                  Joining Requests
                </Text>
                <Text className="mt-0.5 font-nunito text-[12px] text-neutral-light">
                  Approve or reject requests
                </Text>
              </View>
              <Ionicons
                name={showRequests ? "chevron-up" : "chevron-forward"}
                size={20}
                color={colors.neutral.light}
              />
            </TouchableOpacity>
          )}

          {showRequests && requests.length > 0 && (
            <View>
              <View className="bg-primary-surface px-4 py-2">
                <Text className="font-nunito-semibold text-[13px] text-primary">
                  Pending Requests ({requests.length})
                </Text>
              </View>
              {requests.map((person) => (
                <RequestRow
                  key={person._id}
                  person={person}
                  eventId={id!}
                  onAction={refetchRequests}
                />
              ))}
            </View>
          )}

          <View className="px-4 py-3">
            <Text className="font-nunito-semibold text-[14px] text-neutral-light">
              JOINED ({participants.length})
            </Text>
          </View>

          {participants.length === 0 ? (
            <View className="items-center justify-center py-12">
              <Ionicons
                name="people-outline"
                size={48}
                color={colors.neutral.lightest}
              />
              <Text className="mt-3 font-nunito text-[15px] text-neutral-light">
                No participants yet
              </Text>
            </View>
          ) : (
            participants.map((person) => (
              <ParticipantRow key={person._id} person={person} />
            ))
          )}

          <View className="h-10" />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
