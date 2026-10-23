import React from "react";
import { Linking, Text, View } from "react-native";

import { colors } from "@/constants/theme";

interface DetailRowProps {
  label: string;
  value: string | null | undefined;
  isLink?: boolean;
}

function DetailRow({ label, value, isLink = false }: DetailRowProps) {
  if (!value) return null;

  const handlePress = () => {
    if (isLink) {
      const url = value.startsWith("http") ? value : `https://${value}`;
      Linking.openURL(url).catch(() => {});
    }
  };

  return (
    <View
      className="py-3"
      style={{
        borderBottomWidth: 1,
        borderBottomColor: colors.neutral.lightest,
      }}
    >
      <Text className="mb-0.5 text-xs text-neutral-light">{label}</Text>
      <Text
        className="text-base text-neutral"
        onPress={isLink ? handlePress : undefined}
        style={isLink ? { color: colors.primary.DEFAULT } : undefined}
      >
        {value}
      </Text>
    </View>
  );
}

interface Props {
  bio: string;
  /** Show phone only if showMobileNumber is true, OR if the viewer is the owner */
  phoneNumber: string | null;
  /** Show email only if showEmail is true, OR if the viewer is the owner */
  email: string | null;
  /** Show website only if showWebsite is true, OR if the viewer is the owner */
  website: string | null;
  city: string | null;
}

/**
 * Displays textual profile details: bio, contact info, and location.
 * Privacy filtering is already applied by the backend; this component
 * simply renders whatever it receives (null values are hidden).
 * @param root0
 * @param root0.bio
 * @param root0.phoneNumber
 * @param root0.email
 * @param root0.website
 * @param root0.city
 */
export function ProfileDetails({
  bio,
  phoneNumber,
  email,
  website,
  city,
}: Props) {
  const hasAnyDetail = bio || phoneNumber || email || website || city;

  if (!hasAnyDetail) return null;

  return (
    <View className="mx-4 mt-4 rounded-2xl bg-surface px-4">
      {bio ? (
        <View
          className="py-3"
          style={{
            borderBottomWidth: 1,
            borderBottomColor: colors.neutral.lightest,
          }}
        >
          <Text className="mb-0.5 text-xs text-neutral-light">Bio</Text>
          <Text className="text-base leading-6 text-neutral">{bio}</Text>
        </View>
      ) : null}
      <DetailRow label="City" value={city} />
      <DetailRow label="Phone" value={phoneNumber} />
      <DetailRow label="Email" value={email} />
      <DetailRow label="Website" value={website} isLink />
    </View>
  );
}
