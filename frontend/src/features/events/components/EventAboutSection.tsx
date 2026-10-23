import React from "react";
import { Text, View } from "react-native";

interface EventAboutSectionProps {
  description?: string;
  tags?: string[];
  facilities?: string[];
}

/**
 * Renders the "About" section matching the prev_vol design:
 * thick divider, "About the Event" heading, description,
 * tags in primary color, "Perks for Participants" with border pills,
 * and a closing thick divider.
 *
 * @param root0 - Component props.
 * @param root0.description - Event description text.
 * @param root0.tags - Array of tag strings.
 * @param root0.facilities - Array of facility/perk strings.
 * @returns {JSX.Element} The rendered about section.
 */
export function EventAboutSection({
  description,
  tags,
  facilities,
}: EventAboutSectionProps): React.JSX.Element {
  const hasTags = tags && tags.length > 0;
  const hasFacilities = facilities && facilities.length > 0;
  const hasContent = description || hasTags || hasFacilities;

  if (!hasContent) return <View />;

  return (
    <View>
      {/* Thick Divider */}
      <View className="h-[6px] bg-neutral-lightest" />

      {/* About the Event */}
      {description ? (
        <View className="mt-4 px-4">
          <Text className="font-nunito-bold text-[18px] text-neutral-black">
            About the Event
          </Text>
          <Text className="my-2 font-nunito text-[14px] text-neutral-dark">
            {description}
          </Text>
        </View>
      ) : null}

      {/* Tags */}
      {hasTags ? (
        <View className="mt-4 px-4">
          <Text className="font-nunito text-[14px] text-primary">
            {tags.map((tag) => `#${tag}`).join(" ")}
          </Text>
        </View>
      ) : null}

      {/* Perks for Participants */}
      {hasFacilities ? (
        <View className="my-4 px-4">
          <Text className="font-nunito-bold text-[18px] text-neutral-black">
            Perks for Participants
          </Text>
          <View className="mt-2 flex-row flex-wrap">
            {facilities.map((perk) => (
              <View
                key={perk}
                className="m-1 items-center justify-center rounded-full border border-primary p-2"
              >
                <Text className="font-nunito text-[14px] text-primary">
                  {perk}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {/* Thick Divider */}
      <View className="h-[6px] bg-neutral-lightest" />
    </View>
  );
}
