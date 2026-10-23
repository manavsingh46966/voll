import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Href, router } from "expo-router";

import { useAuthStore } from "@/src/features/auth/stores/auth.store";
import { clientStorage } from "@/src/lib/storage";

import { EventAboutSection } from "../components/EventAboutSection";
import {
  EventDetailsHeader,
  EventNotFound,
} from "../components/EventDetailsHeader";
import { EventInfoSection } from "../components/EventInfoSection";
import { EventSlotsSection } from "../components/EventSlotsSection";
import { EventTabBar } from "../components/EventTabBar";
import { OrganizerActions } from "../components/OrganizerActions";
import { OrganizerTooltip } from "../components/OrganizerTooltip";
import { VolunteerActions } from "../components/VolunteerActions";
import { YourTimeSlot } from "../components/YourTimeSlot";
import { useEventDetails } from "../hooks/useEventDetails";
import { useEventParticipants } from "../hooks/useEventParticipants";
import { useToggleInterest } from "../hooks/useToggleInterest";

interface EventDetailsScreenProps {
  eventId: string;
}

/**
 * Full event details screen matching the prev_vol design.
 * Section order: Header → TabBar → Info → Actions → About → Slots.
 *
 * Non-organizers see: join button, then an Interested + Share row
 * (only while joining is still open and event isn't full).
 *
 * Organizers see: Invite/Share + Clone (pre-event) or Mark Attendance +
 * Invite/Share/Clone (post-start), plus a View Participants shortcut.
 *
 * @param root0 - Component props.
 * @param root0.eventId - The MongoDB ObjectId string from route params.
 * @returns {JSX.Element} The rendered event details screen.
 */
export function EventDetailsScreen({
  eventId,
}: EventDetailsScreenProps): React.JSX.Element {
  const user = useAuthStore((s) => s.user);
  const { data: event, isLoading, isError } = useEventDetails(eventId);
  const { data: participantsData } = useEventParticipants(eventId);

  // Local optimistic toggle — null means "use server value"
  const [localIsInterested, setLocalIsInterested] = useState<boolean | null>(
    null,
  );
  const [showTooltip, setShowTooltip] = useState(false);
  const toggleInterestMutation = useToggleInterest(eventId);

  // Organizer one-time tooltip — shown 1.5 s after load, once per event
  const isOrganizer =
    !!event?.createdBy &&
    String(event.createdBy.userId) === String(user?.userId);

  useEffect(() => {
    if (!event || !isOrganizer) return;
    const tooltipKey = `tooltip_shown_event_${eventId}`;
    const hasShown = clientStorage.getItem(tooltipKey);
    if (hasShown) return;
    const timer = setTimeout(() => setShowTooltip(true), 1500);
    return () => clearTimeout(timer);
  }, [event, isOrganizer, eventId]);

  const dismissTooltip = useCallback(() => {
    clientStorage.setItem(`tooltip_shown_event_${eventId}`, "true");
    setShowTooltip(false);
  }, [eventId]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator size="large" color="#01A39F" />
      </View>
    );
  }

  if (isError || !event) {
    return <EventNotFound />;
  }

  /* ── Derived state ── */
  const isJoined = event.isJoined ?? false;
  const isPending = event.isPending ?? false;
  const hasAccess = isOrganizer || isJoined;
  const isStarted = event.fromDateTime
    ? new Date() >= new Date(event.fromDateTime)
    : false;
  const registeredCount = event.numberOfVolunteers ?? 0;
  const maxVolunteers = event.reqMaxVolunteers ?? 0;
  const isFull = maxVolunteers > 0 && registeredCount >= maxVolunteers;
  const isJoiningClosed = event.lastDateOfJoining
    ? new Date(event.lastDateOfJoining) < new Date()
    : false;

  // Interested state: local override takes priority over server value
  const isInterested =
    localIsInterested !== null
      ? localIsInterested
      : (event.isInterested ?? false);

  // User's registered slot — found by matching current user's _id in participants list
  const userId = user?.id ?? user?.userId ?? "";
  const userRegistration = participantsData?.registeredUsers.find(
    (p) => String(p._id) === String(userId),
  );

  /* ── Handlers ── */
  const handleInterested = () => {
    setLocalIsInterested(
      (prev) => !(prev !== null ? prev : (event.isInterested ?? false)),
    );
    toggleInterestMutation.mutate();
  };

  const handleMoreOptions = () => {
    Alert.alert("Event Options", undefined, [
      {
        text: "View Participants",
        onPress: () =>
          router.push(
            `/(drawer)/event/${eventId}/participants` as unknown as Href,
          ),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
      <OrganizerTooltip
        visible={showTooltip}
        registeredCount={registeredCount}
        maxVolunteers={maxVolunteers}
        onDismiss={dismissTooltip}
      />

      <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
        {/* Top bar + image + overlay bar */}
        <EventDetailsHeader
          photoURL={event.photoURL}
          registeredUsersCount={registeredCount}
          reqMaxVolunteers={maxVolunteers}
          interestedUsersCount={event.interestedUsersCount ?? 0}
          isOrganizer={isOrganizer}
          onMoreOptions={handleMoreOptions}
          onPressParticipants={() =>
            router.push(
              `/(drawer)/event/${eventId}/participants` as unknown as Href,
            )
          }
        />

        {/* Tab bar (Details / Instructions / Q&A) */}
        <EventTabBar eventId={eventId} hasAccess={hasAccess} />

        {/* Title, category, location, organizer, dates */}
        <EventInfoSection event={event} />

        {/* ── Action buttons — after info, before about (matches prev_vol order) ── */}
        {isOrganizer ? (
          <OrganizerActions
            eventId={eventId}
            eventTitle={event.title}
            isStarted={isStarted}
          />
        ) : (
          <VolunteerActions
            event={event}
            showInterestRow={!isJoined && !isJoiningClosed && !isFull}
            isInterested={isInterested}
            isTogglingInterest={toggleInterestMutation.isPending}
            onToggleInterested={handleInterested}
          />
        )}

        {/* Description, tags, facilities */}
        <EventAboutSection
          description={event.description}
          tags={event.tags}
          facilities={event.facilities}
        />

        {isJoined && userRegistration?.slotId && (
          <YourTimeSlot registration={userRegistration} />
        )}

        {/* Time slots and skill groups */}
        <EventSlotsSection
          timeSlotsGroup={event.timeSlotsGroup}
          skillsGroup={event.skillsGroup}
          skillsRequired={event.skillsRequired}
        />

        {/* Bottom spacing */}
        <View className="py-5" />
      </ScrollView>
    </SafeAreaView>
  );
}
