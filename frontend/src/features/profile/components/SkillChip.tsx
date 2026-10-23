import React from "react";
import { Text, View } from "react-native";

import { colors } from "@/constants/theme";

interface Props {
  label: string;
}

/**
 * A pill/chip UI element used to display a single skill or interest tag.
 * @param root0
 * @param root0.label
 */
export function SkillChip({ label }: Props) {
  return (
    <View
      className="m-1 rounded-2xl px-3 py-1.5"
      style={{ backgroundColor: colors.primary.DEFAULT + "1A" }} // 10% opacity
    >
      <Text
        className="text-sm font-semibold"
        style={{ color: colors.primary.DEFAULT }}
      >
        {label}
      </Text>
    </View>
  );
}
