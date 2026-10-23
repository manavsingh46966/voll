import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

interface ProgressCircleProps {
  /** Radius of the circle in pixels. Diameter = radius * 2. */
  radius?: number;
  /** Current filled count. */
  curr?: number;
  /** Maximum capacity. */
  total?: number;
  /** 0 = light mode (white text), 1 = dark mode (black text). */
  mode?: 0 | 1;
}

const STROKE_WIDTH = 4;

/**
 * Circular progress indicator matching the prev_vol ProgressCircle design.
 * Displays curr above a divider above total centered inside the ring.
 *
 * Color coding:
 * - less than 50 percent → Teal (#01A39F)
 * - 50-99 percent → Orange (#F2994A)
 * - 100 percent → Red (#EB5757)
 *
 * @param root0 - Component props.
 * @param root0.radius - Radius of the SVG circle.
 * @param root0.curr - Current filled count.
 * @param root0.total - Maximum capacity.
 * @param root0.mode - Display mode: 0 (light/white text) or 1 (dark/black text).
 * @returns {JSX.Element} The rendered progress circle.
 */
export function ProgressCircle({
  radius = 50,
  curr = 0,
  total = 100,
  mode = 0,
}: ProgressCircleProps): React.JSX.Element {
  const diameter = radius * 2;
  const circumference = 2 * Math.PI * radius;
  const percent = total > 0 ? (curr / total) * 100 : 0;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  let color = "#01A39F";
  if (percent >= 100) {
    color = "#EB5757";
  } else if (percent >= 50) {
    color = "#F2994A";
  }

  const fontSize = radius / 2.2;
  const textColor = mode === 0 ? "#ffffff" : "#000000";
  const dividerColor = mode === 0 ? "#ffffff" : "#D1D5DB";

  return (
    <View style={styles.container}>
      <Svg width={diameter} height={diameter}>
        <Circle
          cx={radius}
          cy={radius}
          r={radius - STROKE_WIDTH / 2}
          stroke="#E0E0E0"
          strokeWidth={STROKE_WIDTH}
          fill="none"
        />
        <Circle
          cx={radius}
          cy={radius}
          r={radius - STROKE_WIDTH / 2}
          stroke={color}
          strokeWidth={STROKE_WIDTH}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${radius}, ${radius}`}
        />
      </Svg>
      <View style={[styles.textContainer, { width: diameter, height: diameter }]}>
        <Text style={[styles.number, { fontSize, color: textColor }]}>
          {curr}
        </Text>
        <View
          style={{
            width: radius / 0.95,
            height: radius / 25,
            backgroundColor: dividerColor,
            marginVertical: 1,
          }}
        />
        <Text style={[styles.number, { fontSize, color: textColor }]}>
          {total}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  number: {
    fontWeight: "bold",
  },
  textContainer: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
});
