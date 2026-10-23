import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Feather, MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuthStore } from "@/src/features/auth/stores/auth.store";

import { EventTabBar } from "../components/EventTabBar";
import { useEventDetails } from "../hooks/useEventDetails";
import { useAddInstruction, useEventInstructions } from "../hooks/useEventInstructions";
import type { EventInstruction } from "../types";

const FALLBACK_AVATAR =
  "https://cdn-icons-png.flaticon.com/512/219/219970.png";

interface InstructionsScreenProps {
  eventId: string;
}

/**
 * Instructions screen for a specific event.
 * Shows organizer instructions in a chat-style feed.
 * Organizers can post new instructions via the input bar at the bottom.
 *
 * @param root0 - Component props.
 * @param root0.eventId - The numeric event identifier.
 * @returns {JSX.Element} The rendered instructions screen.
 */
export function InstructionsScreen({
  eventId,
}: InstructionsScreenProps): React.JSX.Element {
  const scrollRef = useRef<ScrollView>(null);

  const user = useAuthStore((s) => s.user);
  const { data: event } = useEventDetails(eventId);
  const { data: instructions = [], isLoading } = useEventInstructions(eventId);
  const addMutation = useAddInstruction(eventId);

  const [inputText, setInputText] = useState("");

  const isOrganizer =
    !!event?.createdBy && String(event.createdBy.userId) === String(user?.userId);
  const isJoined = event?.isJoined ?? false;
  const hasAccess = isOrganizer || isJoined;

  const scrollToBottom = useCallback(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, []);

  useEffect(() => {
    if (instructions.length > 0) {
      setTimeout(scrollToBottom, 100);
    }
  }, [instructions.length, scrollToBottom]);

  const handleSend = useCallback(() => {
    const text = inputText.trim();
    if (!text || !event) return;

    addMutation.mutate(
      { eventId, ev_id: event._id, message: text },
      {
        onSuccess: () => setInputText(""),
        onError: () =>
          Alert.alert("Error", "Failed to send instruction. Please try again."),
      },
    );
  }, [inputText, event, eventId, addMutation]);

  const formatDate = (date: string | Date): string => {
    const today = new Date();
    const d = new Date(date);

    if (today.toDateString() === d.toDateString()) return "TODAY";

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (yesterday.toDateString() === d.toDateString()) return "YESTERDAY";

    return d
      .toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
      .toUpperCase();
  };

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
      {/* Top bar */}
      <View className="mt-8 flex-row items-center justify-between px-4 py-4">
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-11 w-11 items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <MaterialIcons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
      </View>

      {/* Tab bar */}
      <EventTabBar eventId={eventId} hasAccess={hasAccess} />

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8 }}
        onContentSizeChange={scrollToBottom}
        keyboardDismissMode="on-drag"
      >
        {isLoading ? (
          <View className="flex-1 items-center justify-center py-10">
            <ActivityIndicator size="large" color="#01A39F" />
          </View>
        ) : instructions.length === 0 ? (
          <View className="flex-1 items-center justify-center py-10">
            <Text className="px-6 text-center font-nunito text-[14px] text-neutral-light">
              {isOrganizer
                ? "No instructions yet. Post the first instruction for your volunteers."
                : "No instructions have been provided yet."}
            </Text>
          </View>
        ) : (
          instructions.map((instr, index) => (
            <InstructionBubble
              key={instr.msg_id ?? index}
              instruction={instr}
              formatDate={formatDate}
              organizerPhoto={event?.createdBy ? undefined : undefined}
            />
          ))
        )}
      </ScrollView>

      {/* Divider */}
      <View className="h-[1px] bg-neutral-lightest" />

      {/* Input (organizer only) */}
      {isOrganizer && (
        <View className="flex-row items-end gap-2 px-4 py-3">
          <View className="flex-1 rounded-2xl border border-neutral-lightest bg-surface-gray px-4 py-2">
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Write an instruction..."
              placeholderTextColor="#8E8E93"
              multiline
              className="font-nunito text-[15px] text-neutral-black"
              style={{ maxHeight: 100 }}
              onSubmitEditing={Keyboard.dismiss}
            />
          </View>
          <TouchableOpacity
            onPress={handleSend}
            disabled={!inputText.trim() || addMutation.isPending}
            className="mb-1 h-10 w-10 items-center justify-center rounded-full bg-primary disabled:bg-primary-disabled"
            accessibilityRole="button"
            accessibilityLabel="Send instruction"
          >
            {addMutation.isPending ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Feather name="send" size={18} color="white" />
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

/* ── Private sub-components ───────────────────────── */

interface InstructionBubbleProps {
  instruction: EventInstruction;
  formatDate: (date: string | Date) => string;
  organizerPhoto?: string;
}

function InstructionBubble({
  instruction,
  formatDate,
  organizerPhoto,
}: InstructionBubbleProps): React.JSX.Element {
  const dateLabel = formatDate(instruction.createdAt);

  return (
    <View className="items-center py-3">
      {/* Date separator */}
      <View className="mb-2 px-2 py-1">
        <Text className="rounded-sm bg-neutral-lightest px-2.5 py-0.5 font-nunito text-[12px] text-neutral-light">
          {dateLabel}
        </Text>
      </View>

      {/* Message row */}
      <View className="flex-row items-end gap-2">
        <Image
          source={{ uri: organizerPhoto ?? FALLBACK_AVATAR }}
          style={{ height: 40, width: 40, borderRadius: 20 }}
          contentFit="cover"
        />
        <View className="max-w-[75%] rounded-2xl rounded-bl-none bg-neutral-lightest px-4 py-3">
          <Text className="font-nunito text-[15px] text-neutral-black">
            {instruction.message}
          </Text>
        </View>
      </View>
    </View>
  );
}
