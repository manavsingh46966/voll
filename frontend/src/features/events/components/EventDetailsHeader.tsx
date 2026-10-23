import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Image, ImageBackground } from "expo-image";
import { router } from "expo-router";

import { Feather, MaterialIcons } from "@expo/vector-icons";

import { ProgressCircle } from "./ProgressCircle";

const FALLBACK_IMAGE =
  "https://images.pexels.com/photos/697259/pexels-photo-697259.jpeg?cs=srgb&dl=pexels-hieu-697259.jpg";

interface EventDetailsHeaderProps {
  photoURL?: string;
  registeredUsersCount: number;
  reqMaxVolunteers: number;
  interestedUsersCount: number;
  /** Whether the current user is the event organizer. */
  isOrganizer?: boolean;
  /** Called when the organizer taps the more-options (⋮) button. */
  onMoreOptions?: () => void;
  /** Called when the organizer taps the ProgressCircle to view participants. */
  onPressParticipants?: () => void;
}

/**
 * Event details header matching the prev_vol design:
 * 1. Top bar with back arrow on white background.
 * 2. Full-width event image (208px).
 * 3. Dark overlay bar (68px) with "More Photos", interested count,
 *    and a ProgressCircle showing joined / max volunteers.
 *
 * @param root0 - Component props.
 * @param root0.photoURL - URL for the event banner image.
 * @param root0.registeredUsersCount - Count of registered volunteers.
 * @param root0.reqMaxVolunteers - Maximum volunteer capacity.
 * @param root0.interestedUsersCount - Count of interested users.
 * @returns {JSX.Element} The rendered header section.
 */
export function EventDetailsHeader({
  photoURL,
  registeredUsersCount,
  reqMaxVolunteers,
  interestedUsersCount,
  isOrganizer,
  onMoreOptions,
  onPressParticipants,
}: EventDetailsHeaderProps): React.JSX.Element {
  const imageUri = photoURL || FALLBACK_IMAGE;

  return (
    <View>
      {/* Top Bar */}
      <View className="mt-8 flex-row items-center justify-between px-4 py-4">
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="h-11 w-11 items-center justify-center"
        >
          <MaterialIcons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>

        {/* More options — organizers only */}
        {isOrganizer ? (
          <TouchableOpacity
            onPress={onMoreOptions}
            accessibilityRole="button"
            accessibilityLabel="More options"
            className="h-11 w-11 items-center justify-center"
          >
            <Feather name="more-vertical" size={24} color="black" />
          </TouchableOpacity>
        ) : (
          <View className="w-11" />
        )}
      </View>

      {/* Event Image */}
      <Image
        source={{ uri: imageUri }}
        contentFit="cover"
        className="h-[208px] w-full"
        accessibilityLabel="Event banner image"
      />

      {/* Dark Overlay Bar */}
      <View className="relative h-[68px]">
        <ImageBackground
          source={{ uri: imageUri }}
          contentFit="cover"
          style={styles.overlayImg}
        >
          <View style={styles.overlay}>
            <View className="flex-row items-center justify-between px-2">
              {/* More Photos */}
              <View className="items-center">
                <Feather
                  name="image"
                  size={32}
                  color="white"
                  accessibilityLabel="More photos"
                />
                <Text className="font-nunito text-[12px] text-white">
                  More Photos
                </Text>
              </View>

              {/* Interested + Joined */}
              <View className="flex-row items-center gap-1">
                {/* Interested */}
                <View className="my-1 items-center">
                  <MaterialIcons name="star" size={20} color="white" />
                  <Text className="font-nunito-bold text-[16px] text-white">
                    {interestedUsersCount}
                  </Text>
                  <Text className="font-nunito text-[12px] text-white">
                    Interested
                  </Text>
                </View>

                {/* Joined progress */}
                {isOrganizer ? (
                  <TouchableOpacity
                    className="flex-row items-center px-2"
                    onPress={onPressParticipants}
                    accessibilityRole="button"
                    accessibilityLabel="View participants"
                  >
                    <ProgressCircle
                      radius={24}
                      curr={registeredUsersCount}
                      total={reqMaxVolunteers || 1}
                    />
                    <Text className="pl-2 font-nunito text-[12px] text-white">
                      Joined
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View className="flex-row items-center px-2">
                    <ProgressCircle
                      radius={24}
                      curr={registeredUsersCount}
                      total={reqMaxVolunteers || 1}
                    />
                    <Text className="pl-2 font-nunito text-[12px] text-white">
                      Joined
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </ImageBackground>
      </View>
    </View>
  );
}

/**
 * Empty state displayed when event data is not found.
 *
 * @returns {JSX.Element} The rendered not-found message.
 */
export function EventNotFound(): React.JSX.Element {
  return (
    <View className="flex-1 items-center justify-center bg-surface-gray px-6">
      <Text className="mb-1 font-nunito-semibold text-big text-neutral-dark">
        Event not found
      </Text>
      <Text className="text-center font-nunito text-body text-neutral-gray">
        This event may have been removed.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  overlayImg: {
    height: "100%",
    width: "100%",
    position: "absolute",
  },
});
