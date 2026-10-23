import React, { forwardRef, useCallback, useMemo, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";

import { colors } from "@/constants/theme";

import { ZONES } from "../../data/timeZones";

/**
 * Properties expected by the {@link TimezoneBottomSheet} component.
 */
interface Props {
  /**
   * Callback fired when a timezone is selected. Passes back the timezone detail object.
   *
   * @param tz The selected timezone object containing value identifier and short abbreviation string.
   */
  onSelect: (tz: { value: string; shortform: string }) => void;
}

/**
 * TimezoneBottomSheet is an interactive overlay modal bottom sheet that allows users to search
 * and choose a timezone. It lists timezones structured by geographical regions, supports text filtering,
 * and includes a fast option to use the local default/current timezone.
 *
 * Uses `forwardRef` to pass control of the underlying {@link BottomSheetModal} up to parent components.
 */
export const TimezoneBottomSheet = forwardRef<BottomSheetModal, Props>(
  ({ onSelect }, ref) => {
    const snapPoints = useMemo(() => ["60%", "90%"], []);
    const [query, setQuery] = useState("");

    const filteredZones = ZONES.map((region) => ({
      ...region,
      items: region.items.filter(
        (item) =>
          item.label.toLowerCase().includes(query.toLowerCase()) ||
          item.code.toLowerCase().includes(query.toLowerCase()),
      ),
    })).filter((region) => region.items.length > 0);

    /**
     * Renders a dimming overlay backdrop component behind the sheet using {@link BottomSheetBackdrop}.
     * Dismisses the sheet on press and has a styled opacity transition.
     *
     * @param {any} props Backdrop component attributes.
     * @returns {React.JSX.Element} A touchable Backdrop backdrop element.
     */
    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.6} // Adjust 0.1 to 1 for darker/lighter grey
        />
      ),
      [],
    );

    return (
      <BottomSheetModal
        ref={ref}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose
        backgroundStyle={{ borderRadius: 24 }} // Premium rounded corners
        backdropComponent={renderBackdrop}
      >
        <View className="px-4 py-2">
          <Text className="mb-4 font-nunito-bold text-[18px] text-primary">
            Select Time Zone
          </Text>

          <View className="mb-4 flex-row items-center rounded-xl border border-neutral-lightest px-3 py-2">
            <Ionicons name="search" size={18} color={colors.neutral.light} />
            <BottomSheetTextInput
              className="ml-2 flex-1 font-nunito text-[15px] text-neutral"
              value={query}
              onChangeText={setQuery}
              placeholder="Search for area, street name"
              placeholderTextColor={colors.neutral.light}
            />
          </View>

          <TouchableOpacity
            accessibilityRole="button"
            className="flex-row items-center border-b border-neutral-lightest pb-4"
            onPress={() =>
              onSelect({ value: "Asia/Kolkata", shortform: "IST" })
            }
          >
            <Ionicons
              name="locate-outline"
              size={20}
              color={colors.neutral.light}
            />
            <Text className="ml-2 font-nunito text-[15px] text-neutral">
              Use current time zone
            </Text>
          </TouchableOpacity>
        </View>

        <BottomSheetScrollView className="mt-2 flex-1 px-4">
          {filteredZones.map((section) => (
            <View key={section.region} className="mb-6">
              <Text className="mb-2 font-nunito-bold text-[16px] text-neutral">
                {section.region}
              </Text>
              {section.items.map((item) => (
                <TouchableOpacity
                  accessibilityRole="button"
                  key={item.code}
                  className="flex-row items-center justify-between py-3"
                  onPress={() =>
                    onSelect({ value: item.code, shortform: item.code })
                  }
                >
                  <Text className="font-nunito text-[14px] text-neutral-light">
                    {item.label} ({item.code})
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  },
);
