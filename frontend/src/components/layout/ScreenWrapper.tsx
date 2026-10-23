import React, { useMemo } from "react";
import { StyleProp, View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "@/constants/theme";

interface Props {
  children: React.ReactNode;
  bg?: string; // Optional Background Color
  style?: StyleProp<ViewStyle>;
}

/**
 * **Safe Area Screen Wrapper**
 *
 * A foundational layout component that wraps every screen to ensure content
 * respects the device's physical limitations (Notches, Dynamic Islands, Home Indicators).
 *
 * **Key Features:**
 * - **Safe Area Padding:** Automatically adds padding to the Bottom, Left, and Right.
 * - **Top Inset Ignored:** Intentionally ignores the Top inset as this is typically handled by the `CustomHeader`.
 * - **Performance:** Uses `useMemo` to prevent unnecessary style re-calculations on re-renders.
 *
 * @component
 * @param {Props} props - Component properties.
 * @param {React.ReactNode} props.children - The screen content to render.
 * @param {string} [props.bg] - The background color of the screen container.
 * @param {StyleProp<ViewStyle>} [props.style] - Optional additional styles to merge with the container.
 *
 * @returns {JSX.Element} A View container with dynamic padding and background color.
 */
export const ScreenWrapper = ({
  children,
  bg = colors.surface.DEFAULT,
  style,
}: Props) => {
  const insets = useSafeAreaInsets();

  // Optimization: Memoize dynamic styles to prevent re-renders and satisfy basic linting
  const dynamicContainerStyle = useMemo(
    () => ({
      backgroundColor: bg,
      paddingBottom: insets.bottom,
      paddingLeft: insets.left,
      paddingRight: insets.right,
    }),
    [bg, insets.bottom, insets.left, insets.right],
  );

  return (
    <View
      // 1. Static Layout uses Tailwind
      className="flex-1"
      // 2. Dynamic Values (Insets/Colors) use Style
      style={[dynamicContainerStyle, style]}
    >
      {children}
    </View>
  );
};
