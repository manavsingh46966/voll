import React, { useState } from "react";
import { TextInput, TextInputProps, View } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { colors } from "@/constants/theme";

interface FloatingInputProps extends TextInputProps {
  label: string;
}

/**
 *
 * @param root0
 * @param root0.label
 * @param root0.value
 * @param root0.onChangeText
 * @param root0.className
 */
export function FloatingInput({
  label,
  value,
  onChangeText,
  className,
  ...props
}: FloatingInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  // Reanimated shared value: 0 = inactive, 1 = active (floating)
  const anim = useSharedValue(value ? 1 : 0);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    anim.value = withTiming(1, { duration: 150 });
    props.onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    if (!value) {
      anim.value = withTiming(0, { duration: 150 });
    }
    props.onBlur?.(e);
  };

  // Runs on the native UI thread for zero lag
  const labelStyle = useAnimatedStyle(() => {
    return {
      top: interpolate(anim.value, [0, 1], [16, -10]), // Moves up onto the border
      fontSize: interpolate(anim.value, [0, 1], [15, 12]),
      color: isFocused ? colors.primary.DEFAULT : colors.neutral.light,
    };
  });

  return (
    <View
      className={`relative w-full rounded-xl border ${isFocused ? "border-primary" : "border-neutral-lightest"} bg-white px-3 py-1 ${className}`}
    >
      <Animated.Text
        className="absolute left-3 bg-white px-1 font-nunito-semibold"
        style={labelStyle}
        pointerEvents="none" // Ensures taps pass through to the input
      >
        {label}
      </Animated.Text>
      <TextInput
        className="min-h-[48px] pt-3 font-nunito text-[16px] text-neutral"
        value={value}
        onChangeText={onChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        selectionColor={colors.primary.DEFAULT}
        {...props}
      />
    </View>
  );
}
