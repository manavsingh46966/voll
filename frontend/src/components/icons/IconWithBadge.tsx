import React from "react";
import { Text, View } from "react-native";

import { colors } from "@/constants/theme";

import { TabIcon } from "./TabIcon"; // Your existing SVG renderer

interface Props {
  iconName: "message" | "pray";
  count?: number;
  color: string;
}

/**
 * Renders a story action icon with an optional count badge.
 *
 * @param root0 - Icon badge props.
 * @param root0.iconName - The icon to display.
 * @param root0.count - Optional numeric badge count.
 * @param root0.color - Icon and badge color.
 * @returns The icon with its count badge.
 */
export const IconWithBadge = ({ iconName, count, color }: Props) => {
  return (
    <View className="h-8 w-[38px] items-start justify-center">
      <TabIcon
        name={iconName}
        color={color}
        size={26}
        focused={iconName === "pray" && color !== colors.neutral.light}
      />

      {(count ?? 0) > 0 && (
        <View className="absolute bottom-[-2px] right-0 h-5 w-5 items-center justify-center">
          <View className="absolute rounded-[10px] border-[1.5px] border-neutral-white">
            <TabIcon
              name="badgeCircle"
              color={color}
              size={20}
              focused={true}
            />
          </View>

          <Text className="text-center font-nunito-bold text-[10px] text-neutral-white">
            {count}
          </Text>
        </View>
      )}
    </View>
  );
};
