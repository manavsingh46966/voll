import React, { useState } from "react";
import { Platform, Text, TouchableOpacity, View } from "react-native";

import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";

import { colors } from "@/constants/theme";

/**
 * Properties expected by the {@link DateTimeRow} component.
 */
interface Props {
  /**
   * The text label displayed above the date-time selection boxes (e.g. "Event start").
   */
  label: string;
  /**
   * The ISO-8601 string representation of the currently selected date and time.
   */
  value: string;
  /**
   * Callback triggered when either the date or time selection is updated.
   *
   * @param isoString The newly computed date and time in ISO-8601 format.
   */
  onChange: (isoString: string) => void;
  /**
   * Optional timezone information object containing timezone name and short abbreviation.
   */
  timeZone?: { value: string; shortform: string };
  /**
   * Optional callback fired when the timezone display is clicked.
   */
  onTimezonePress?: () => void;
}

/**
 * DateTimeRow is a cross-platform (iOS, Android, Web) component that renders input controls
 * for selecting both a date and a time, with optional timezone indicator.
 *
 * For Web platform, it renders native `<input type="date">` and `<input type="time">` fields.
 * For Native platforms (iOS/Android), it utilizes the `@react-native-community/datetimepicker` component
 * through touchable overlay rows.
 *
 * @param props The props for the component.
 * @param props.label Label displayed above the input block.
 * @param props.value Current ISO date-time string.
 * @param props.onChange Callback returning updated ISO date-time string.
 * @param props.timeZone Optional timezone info.
 * @param props.onTimezonePress Optional callback to trigger timezone picker sheet.
 * @returns {React.JSX.Element} A layout containing date-time labels and pickers.
 */
export function DateTimeRow({
  label,
  value,
  onChange,
  timeZone,
  onTimezonePress,
}: Props) {
  const [showPicker, setShowPicker] = useState(false);
  const [mode, setMode] = useState<"date" | "time">("date");

  const currentDate = value ? new Date(value) : new Date();

  /**
   * Handles date-time picker updates on native platforms (iOS/Android).
   * Modifies either the year/month/day (in 'date' mode) or hours/minutes (in 'time' mode)
   * on the current date object, and fires the `onChange` callback.
   *
   * @param {any} _ The event metadata parameter.
   * @param {Date} [selectedDate] The date object returned from the native picker.
   * @returns {void}
   */
  const handleNativeChange = (_: any, selectedDate?: Date) => {
    if (Platform.OS === "android") setShowPicker(false);
    if (!selectedDate) return;

    const newDate = new Date(currentDate);
    if (mode === "date") {
      newDate.setFullYear(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
      );
    } else {
      newDate.setHours(selectedDate.getHours(), selectedDate.getMinutes());
    }
    onChange(newDate.toISOString());
  };

  /**
   * Handles date-time changes from native HTML `<input>` tags on the Web platform.
   * Parses either the 'YYYY-MM-DD' date string or the 'HH:MM' time string,
   * updates the corresponding portion of the date object, and fires the `onChange` callback.
   *
   * @param {("date" | "time")} type The input type being modified.
   * @param {string} webValue The raw value string returned from the HTML input element.
   * @returns {void}
   */
  const handleWebChange = (type: "date" | "time", webValue: string) => {
    if (!webValue) return;
    const newDate = new Date(currentDate);

    if (type === "date") {
      const [year, month, day] = webValue.split("-").map(Number);
      newDate.setFullYear(year, month - 1, day);
    } else {
      const [hours, minutes] = webValue.split(":").map(Number);
      newDate.setHours(hours, minutes);
    }
    onChange(newDate.toISOString());
  };

  const dateStr = value
    ? currentDate.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "Date";
  const timeStr = value
    ? currentDate.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : "Time";

  // Shared Tailwind classes to ensure web inputs and native buttons look identical
  const boxClasses =
    "h-12 items-center justify-center rounded-xl border border-neutral-lightest bg-white";
  const textClasses = `font-nunito text-[14px] ${value ? "text-neutral" : "text-neutral-light"}`;

  return (
    <View className="mb-6">
      <Text className="mb-2 font-nunito-bold text-[14px] text-neutral">
        {label}
      </Text>

      {/* Uses strict percentages and justify-between to prevent layout overflow */}
      <View className="flex-row items-center">
        {/* DATE BOX (Fixed at 42% width + margin) */}
        {Platform.OS === "web" ? (
          <input
            type="date"
            value={value ? currentDate.toISOString().split("T")[0] : ""}
            onChange={(e) => handleWebChange("date", e.target.value)}
            className={`mr-3 w-[42%] px-3 outline-none ${boxClasses} ${textClasses}`}
          />
        ) : (
          <TouchableOpacity
            accessibilityRole="button"
            className={`mr-3 w-[42%] ${boxClasses}`}
            onPress={() => {
              setMode("date");
              setShowPicker(true);
            }}
          >
            <Text className={textClasses}>{dateStr}</Text>
          </TouchableOpacity>
        )}

        {/* TIME BOX (Fixed at 32% width + margin) */}
        {Platform.OS === "web" ? (
          <input
            type="time"
            value={value ? currentDate.toTimeString().slice(0, 5) : ""}
            onChange={(e) => handleWebChange("time", e.target.value)}
            className={`mr-3 w-[32%] px-3 outline-none ${boxClasses} ${textClasses}`}
          />
        ) : (
          <TouchableOpacity
            accessibilityRole="button"
            className={`mr-3 w-[32%] ${boxClasses}`}
            onPress={() => {
              setMode("time");
              setShowPicker(true);
            }}
          >
            <Text className={textClasses}>{timeStr}</Text>
          </TouchableOpacity>
        )}

        {/* TIMEZONE BOX (Fills remaining space, only renders if provided) */}
        {timeZone && (
          <TouchableOpacity
            accessibilityRole="button"
            className={`flex-1 flex-row gap-x-1 ${boxClasses}`}
            onPress={onTimezonePress}
          >
            <Text className="font-nunito text-[14px] text-neutral">
              {timeZone.shortform}
            </Text>
            <Ionicons
              name="chevron-down"
              size={16}
              color={colors.neutral.DEFAULT}
            />
          </TouchableOpacity>
        )}
      </View>

      {showPicker && Platform.OS !== "web" && (
        <DateTimePicker
          value={currentDate}
          mode={mode}
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleNativeChange}
        />
      )}
    </View>
  );
}
