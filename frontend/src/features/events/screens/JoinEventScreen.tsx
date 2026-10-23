import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  View,
} from "react-native";

import { Feather, MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { ScrollView } from "react-native-gesture-handler";

import { Button } from "@/src/components/ui/Button";

import { JoinFormBody } from "../components/join";
import { useEventDetails } from "../hooks/useEventDetails";
import { useJoinEvent } from "../hooks/useJoinEvent";

interface JoinEventScreenProps {
  /** MongoDB ObjectId event identifier from route params. */
  eventId: string;
}

/**
 * Full-page join event screen matching the prev_vol design.
 * Composes time slot picker, skill group picker, notes, terms,
 * and a submit button. Uses TanStack Query for event data and
 * useJoinEvent mutation for the join action.
 *
 * @param root0 - Component props.
 * @param root0.eventId - The MongoDB ObjectId event identifier.
 * @returns {JSX.Element} The rendered join event screen.
 */
export function JoinEventScreen({
  eventId,
}: JoinEventScreenProps): React.JSX.Element {
  const { data: event, isLoading, isError } = useEventDetails(eventId);
  const joinMutation = useJoinEvent(eventId);

  const [selectedSlotIds, setSelectedSlotIds] = useState<string[]>([]);
  const [selectedSkillGroupId, setSelectedSkillGroupId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [slotsChecked, setSlotsChecked] = useState(false);
  const [skillChecked, setSkillChecked] = useState(false);

  const toggleTimeSlot = useCallback((slotId: string) => {
    setSelectedSlotIds((prev) => {
      const next = prev.includes(slotId)
        ? prev.filter((id) => id !== slotId)
        : [...prev, slotId];
      setSlotsChecked(next.length > 0);
      return next;
    });
  }, []);

  const selectSkillGroup = useCallback(
    (id: string, _title: string) => {
      if (selectedSkillGroupId === id) {
        setSelectedSkillGroupId(null);
        setSkillChecked(false);
        // Reset slot selection when skill group changes
        setSelectedSlotIds([]);
        setSlotsChecked(false);
      } else {
        setSelectedSkillGroupId(id);
        setSkillChecked(true);
        // Reset slot selection when skill group changes
        setSelectedSlotIds([]);
        setSlotsChecked(false);
      }
    },
    [selectedSkillGroupId],
  );

  const autoCheckSkills = useCallback(() => {
    setSkillChecked(true);
  }, []);

  const handleJoin = useCallback(() => {
    if (!event || !termsAccepted) return;
    if (!slotsChecked && !skillChecked) return;

    joinMutation.mutate(
      {
        eventId: event._id,
        slotId: selectedSlotIds.length > 0 ? selectedSlotIds[0] : undefined,
        skillGroupId: selectedSkillGroupId ?? undefined,
      },
      {
        onSuccess: (data) => {
          const msg = event.allowJoiningRequests
            ? "You have successfully sent request"
            : "You have joined this event";
          Alert.alert("Success", data.message ?? msg, [
            {
              text: "OK",
              onPress: () =>
                router.replace(`/(drawer)/event/${eventId}` as never),
            },
          ]);
        },
        onError: (err) => {
          Alert.alert("Error", err.message ?? "Failed to join event.");
        },
      },
    );
  }, [
    event,
    termsAccepted,
    slotsChecked,
    skillChecked,
    selectedSlotIds,
    selectedSkillGroupId,
    joinMutation,
    eventId,
  ]);

  if (isLoading || isError || !event) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator size="large" color="#01A39F" />
      </View>
    );
  }

  const isDisabled =
    !termsAccepted || (!slotsChecked && !skillChecked) || joinMutation.isPending;

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
      <ScrollView>
        <JoinTopBar />
        <JoinFormBody
          event={event}
          selectedSlotIds={selectedSlotIds}
          selectedSkillGroupId={selectedSkillGroupId}
          notes={notes}
          termsAccepted={termsAccepted}
          onToggleSlot={toggleTimeSlot}
          onSelectGroup={selectSkillGroup}
          onAutoCheckSkills={autoCheckSkills}
          onChangeNotes={setNotes}
          onToggleTerms={() => setTermsAccepted((v) => !v)}
        />
        <View className="mb-16 mt-4 px-4">
          <Button
            title="Continue"
            onPress={handleJoin}
            disabled={isDisabled}
            loading={joinMutation.isPending}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ── Private sub-component ─────────────────────────── */

/**
 * Top bar with back arrow and more-vertical icon.
 *
 * @returns {JSX.Element} The rendered top bar.
 */
function JoinTopBar(): React.JSX.Element {
  return (
    <View className="mt-4 w-full flex-row items-center justify-between p-4 px-4">
      <TouchableOpacity onPress={() => router.back()}>
        <MaterialIcons name="arrow-back" size={24} color="black" />
      </TouchableOpacity>
      <TouchableOpacity>
        <Feather name="more-vertical" size={24} color="black" />
      </TouchableOpacity>
    </View>
  );
}
