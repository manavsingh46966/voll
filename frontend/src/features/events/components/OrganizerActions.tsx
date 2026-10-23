import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Href, router } from "expo-router";

import { AntDesign, Feather, Ionicons, MaterialIcons } from "@expo/vector-icons";

import { SendAnnouncementModal } from "@/src/features/notifications/components/SendAnnouncementModal";

interface OrganizerActionsProps {
  eventId: string;
  eventTitle?: string;
  isStarted: boolean;
}

/**
 * Info line with a leading icon, used under the organiser action buttons.
 *
 * @param props - Component props.
 * @param props.text - The note to display.
 * @returns The info note row.
 */
function InfoNote({ text }: { text: string }): React.JSX.Element {
  return (
    <View className="flex-row gap-2 px-6 pb-3">
      <AntDesign name="info-circle" size={17} color="#01A39F" />
      <Text className="text-sm text-neutral-light">{text}</Text>
    </View>
  );
}

/**
 * Action area for the event organiser. Before the event starts it shows
 * Invite/Share, Broadcast, and Clone; once started it shows Mark Attendance plus
 * Broadcast/Invite/Share/Clone. Always ends with a View Participants shortcut.
 *
 * @param props - Component props.
 * @param props.eventId - The event's MongoDB ObjectId string.
 * @param props.eventTitle - The event title.
 * @param props.isStarted - Whether the event's start time has passed.
 * @returns The organiser action buttons.
 */
export function OrganizerActions({
  eventId,
  eventTitle = "Event",
  isStarted,
}: OrganizerActionsProps): React.JSX.Element {
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);

  const openParticipants = (): void => {
    router.push(`/(drawer)/event/${eventId}/participants` as unknown as Href);
  };

  return (
    <>
      {isStarted ? (
        <>
          <TouchableOpacity
            accessibilityRole="button"
            className="mx-4 mb-2 mt-9 flex-row items-center justify-center rounded-md bg-primary py-2"
            onPress={openParticipants}
          >
            <Text className="font-nunito-semibold text-[18px] text-white">
              Mark Attendance
            </Text>
          </TouchableOpacity>

          <View className="mb-4 flex-row justify-between gap-2 px-4">
            <TouchableOpacity
              accessibilityRole="button"
              className="flex-1 flex-col items-center justify-center rounded-md border border-primary py-2"
            >
              <Feather name="user-plus" size={22} color="#01A39F" />
              <Text className="mt-1 font-nunito-semibold text-xs text-primary">
                Invite
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              className="flex-1 flex-col items-center justify-center rounded-md border border-primary py-2"
            >
              <Feather name="share-2" size={22} color="#01A39F" />
              <Text className="mt-1 font-nunito-semibold text-xs text-primary">
                Share
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              className="flex-1 flex-col items-center justify-center rounded-md border border-primary py-2"
            >
              <MaterialIcons
                name="control-point-duplicate"
                size={22}
                color="#01A39F"
              />
              <Text className="mt-1 font-nunito-semibold text-xs text-primary">
                Clone
              </Text>
            </TouchableOpacity>
          </View>

          <InfoNote text="Mark attendance for volunteers who have arrived at the event." />
        </>
      ) : (
        <>
          <View className="mb-4 mt-9 flex-row justify-between gap-3 px-4">
            <TouchableOpacity
              accessibilityRole="button"
              className="flex-1 flex-row items-center justify-center rounded-md border border-primary py-2"
            >
              <Feather name="user-plus" size={20} color="#01A39F" />
              <Text className="mx-2 font-nunito-semibold text-xl text-primary">
                Invite
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              className="flex-1 flex-row items-center justify-center rounded-md border border-primary py-2"
            >
              <Feather name="share-2" size={20} color="#01A39F" />
              <Text className="mx-4 font-nunito-semibold text-xl text-primary">
                Share
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            accessibilityRole="button"
            className="mx-4 mb-4 flex-row items-center justify-center rounded-md border border-primary py-2"
          >
            <MaterialIcons
              name="control-point-duplicate"
              size={20}
              color="#01A39F"
            />
            <Text className="mx-2 py-2 font-nunito-semibold text-xl text-primary">
              Clone Event
            </Text>
          </TouchableOpacity>

          <InfoNote text="Cloning saves time in creating multiple events whose details or settings might be similar. Changes can be made to the cloned event before publishing it." />
        </>
      )}

      {/* Broadcast Announcement Button */}
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Broadcast Announcement to volunteers"
        className="mx-4 mb-3 flex-row items-center justify-between rounded-xl border border-amber-300 bg-amber-50/90 px-4 py-3 active:bg-amber-100"
        onPress={() => setShowAnnouncementModal(true)}
      >
        <View className="flex-row items-center gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-amber-500">
            <Ionicons name="megaphone" size={20} color="white" />
          </View>
          <View className="flex-1">
            <Text className="font-nunito-bold text-[15px] text-neutral-black">
              Send Announcement
            </Text>
            <Text className="text-xs text-neutral-gray" numberOfLines={1}>
              Broadcast updates to all registered volunteers
            </Text>
          </View>
        </View>
        <MaterialIcons name="chevron-right" size={22} color="#D97706" />
      </TouchableOpacity>

      {/* View Participants */}
      <TouchableOpacity
        accessibilityRole="button"
        className="mx-4 mb-3 flex-row items-center justify-between rounded-xl border border-neutral-lightest bg-surface-gray px-4 py-3"
        onPress={openParticipants}
      >
        <View className="flex-row items-center gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-primary">
            <MaterialIcons name="group" size={20} color="white" />
          </View>
          <Text className="font-nunito-semibold text-[15px] text-neutral-black">
            View Participants
          </Text>
        </View>
        <MaterialIcons name="chevron-right" size={22} color="#8E8E93" />
      </TouchableOpacity>

      {/* Announcement Modal */}
      <SendAnnouncementModal
        visible={showAnnouncementModal}
        onClose={() => setShowAnnouncementModal(false)}
        eventId={eventId}
        eventTitle={eventTitle}
      />
    </>
  );
}
