import React from "react";
import Svg, { Path } from "react-native-svg";

import { colors } from "@/constants/theme";
import { D_VALUES } from "@/src/data/icons";

interface TabIconProps {
  name: keyof typeof D_VALUES;
  color: string;
  size?: number;
  focused?: boolean;
}

/**
 * **Tab Bar Icon Component**
 *
 * A specialized SVG renderer designed for the application's bottom navigation.
 * It handles the visual transition between "Active" (Filled) and "Inactive" (Outlined) states.
 *
 * **Key Logic:**
 * - **Standard Icons:** Render as an outline (`stroke`) when inactive, and solid (`fill`) when focused.
 * - **Menu Icon:** Always renders as a stroke (hamburger menu style).
 * - **Create Icon:** Contains special logic to invert colors for the inner "Plus" sign when active.
 *
 * @component
 * @param {object} props - Component properties.
 * @param {keyof typeof D_VALUES} props.name - The unique identifier for the icon path (must exist in `D_VALUES`).
 * @param {string} props.color - The tint color passed by the Tab Navigator (Active/Inactive color).
 * @param {number} [props.size=28] - The width and height of the icon in pixels. Defaults to 28.
 * @param {boolean} [props.focused=false] - Determines if the tab is currently selected, triggering the Fill style.
 *
 * @returns {JSX.Element | null} The rendered SVG icon or null if the path is invalid.
 */
export const TabIcon = ({
  name,
  color,
  size = 28,
  focused = false,
}: TabIconProps) => {
  const paths = D_VALUES[name];

  if (!paths) return null;

  const strokeOnlyIcons = new Set<keyof typeof D_VALUES>([
    "menu",
    "back",
    "search",
    "options",
    "settings",
    "person",
    "chevronForward",
    "lock",
    "shield",
    "language",
    "help",
    "document",
    "logout",
    "close",
    "camera",
    "chevronDown",
    "checkmark",
    "edit",
    "trash",
  ]);

  const fillOnlyIcons = new Set<keyof typeof D_VALUES>([
    "clipboardClockOutline",
  ]);

  const isStrokeOnly = strokeOnlyIcons.has(name);
  const isFillOnly = fillOnlyIcons.has(name);
  const isCreate = name === "create";

  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      {paths.map((d, index) => {
        let strokeColor = isStrokeOnly ? color : focused ? "none" : color;
        let fillColor = isStrokeOnly ? "none" : focused ? color : "none";

        if (isFillOnly) {
          strokeColor = "none";
          fillColor = color;
        }

        if (isCreate && index === 1) {
          if (focused) {
            fillColor = colors.neutral.white;
            strokeColor = "none";
          } else {
            fillColor = "none";
            strokeColor = color;
          }
        }

        return (
          <Path
            key={index}
            d={d}
            fill={fillColor}
            fillRule="evenodd"
            clipRule="evenodd"
            stroke={strokeColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      })}
    </Svg>
  );
};
