import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

import { Feather } from "@expo/vector-icons";

import type { EventItem } from "../types";

import { JoinEventButton } from "./JoinEventButton";

interface VolunteerActionsProps {
  event: EventItem;
  showInterestRow: boolean;
  isInterested: boolean;
  isTogglingInterest: boolean;
  onToggleInterested: () => void;
}

/**
 * Action area for non-organisers: the join button plus, while joining is
 * still possible, an Interested + Share row.
 *
 * @param props - Component props.
 * @param props.event - The event being viewed.
 * @param props.showInterestRow - Whether to show the Interested + Share row.
 * @param props.isInterested - Current interested state.
 * @param props.isTogglingInterest - Disables the toggle while a request runs.
 * @param props.onToggleInterested - Toggles the interested state.
 * @returns The volunteer action buttons.
 */
export function VolunteerActions({
  event,
  showInterestRow,
  isInterested,
  isTogglingInterest,
  onToggleInterested,
}: VolunteerActionsProps): React.JSX.Element {
  return (
    <>
      {/* Join / Requested / Joined / Full / Period-ended */}
      <JoinEventButton event={event} />

      {showInterestRow && (
        <View className="mb-4 flex-row justify-between gap-3 px-4">
          <TouchableOpacity
            accessibilityRole="button"
            className={`flex-1 flex-row items-center justify-center rounded-md border border-primary py-2 ${
              isInterested ? "bg-primary" : ""
            }`}
            onPress={onToggleInterested}
            disabled={isTogglingInterest}
          >
            <Feather
              name="star"
              size={20}
              color={isInterested ? "white" : "#01A39F"}
            />
            <Text
              className={`mx-2 font-nunito-semibold text-base ${
                isInterested ? "text-white" : "text-primary"
              }`}
            >
              {isInterested ? "Uninterested" : "Interested"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            accessibilityRole="button"
            className="flex-1 flex-row items-center justify-center rounded-md border border-primary py-2"
          >
            <Feather name="share-2" size={20} color="#01A39F" />
            <Text className="mx-4 font-nunito-semibold text-base text-primary">
              Share
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );
}
