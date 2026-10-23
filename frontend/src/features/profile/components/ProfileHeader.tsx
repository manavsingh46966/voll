import React from "react";
import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";

import { colors } from "@/constants/theme";

interface Props {
  name: string | null;
  gender: string | null;
  profileImageUrl: string | null;
  /** If true, tapping the avatar triggers the photo picker */
  isEditable?: boolean;
  onAvatarPress?: () => void;
}

const PLACEHOLDER_AVATAR =
  "https://ui-avatars.com/api/?background=01A39F&color=fff&size=128&name=U";

/**
 * Displays the user's avatar, name, and gender.
 * When `isEditable` is true, the avatar becomes a tappable "change photo" button.
 * @param root0
 * @param root0.name
 * @param root0.gender
 * @param root0.profileImageUrl
 * @param root0.isEditable
 * @param root0.onAvatarPress
 */
export function ProfileHeader({
  name,
  gender,
  profileImageUrl,
  isEditable = false,
  onAvatarPress,
}: Props) {
  const avatarSource = profileImageUrl
    ? { uri: profileImageUrl }
    : { uri: PLACEHOLDER_AVATAR };

  return (
    <View className="items-center py-6">
      {/* Avatar */}
      <Pressable
        accessibilityRole={isEditable ? "button" : "image"}
        accessibilityLabel={
          isEditable
            ? "Change profile photo"
            : `${name ?? "User"}'s profile photo`
        }
        onPress={isEditable ? onAvatarPress : undefined}
        className="relative"
      >
        <Image
          source={avatarSource}
          contentFit="cover"
          className="h-24 w-24 rounded-full"
          style={{ borderWidth: 3, borderColor: colors.primary.DEFAULT }}
        />
        {isEditable && (
          <View
            className="absolute bottom-0 right-0 h-7 w-7 items-center justify-center rounded-full"
            style={{ backgroundColor: colors.primary.DEFAULT }}
          >
            <Text className="text-xs font-bold text-white">✎</Text>
          </View>
        )}
      </Pressable>

      {/* Name */}
      <Text className="mt-3 font-nunito-bold text-xl text-neutral">
        {name ?? "Unknown User"}
      </Text>

      {/* Gender */}
      {gender ? (
        <Text className="mt-0.5 text-sm text-neutral-light">{gender}</Text>
      ) : null}
    </View>
  );
}
