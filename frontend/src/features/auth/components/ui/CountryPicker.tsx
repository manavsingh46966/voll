import React, { memo } from "react";
import { FlatList, Modal, Text, TouchableOpacity, View } from "react-native";

import { Ionicons } from "@expo/vector-icons";

// Adjust import path based on your project structure (Global vs Feature)
import { ALL_COUNTRIES, Country } from "@/src/features/auth/data/countries";

// --- SUB-COMPONENTS ---

interface CountrySelectorBtnProps {
  /** The currently selected country object */
  selected: Country;
  /** Callback to open the modal */
  onPress: () => void;
}

/**
 * The trigger button that displays the flag and dial code.
 * Used in the Phone Number input field.
 *
 * @param {CountrySelectorBtnProps} props - Component properties.
 * @returns {JSX.Element} The touchable button with flag and code.
 */
export const CountrySelectorBtn = ({
  selected,
  onPress,
}: CountrySelectorBtnProps) => (
  <TouchableOpacity
    accessibilityRole="button"
    onPress={onPress}
    activeOpacity={0.7}
    className="mr-3 h-[52px] flex-row items-center rounded-xl border border-neutral-light bg-white px-3"
  >
    <Text className="mr-2 text-2xl">{selected.flag}</Text>
    <Text className="text-base font-bold text-neutral-black">
      {selected.dialCode}
    </Text>
    <Ionicons
      name="chevron-down"
      size={14}
      color="#636366"
      contentContainerClassName="ml-1.5"
    />
  </TouchableOpacity>
);

interface CountryPickerModalProps {
  /** Controls visibility of the modal */
  visible: boolean;
  /** Function to close the modal */
  onClose: () => void;
  /** Function called when a user taps a country */
  onSelect: (country: Country) => void;
}

/**
 * A specific modal to select a country from the supported list.
 * * Uses FlatList for performance optimization with large lists.
 */
export const CountryPickerModal = memo(
  ({ visible, onClose, onSelect }: CountryPickerModalProps) => {
    const renderItem = ({ item }: { item: Country }) => (
      <TouchableOpacity
        accessibilityRole="button"
        className="flex-row items-center border-b border-gray-100 py-4 active:bg-gray-50"
        onPress={() => {
          onSelect(item);
          onClose();
        }}
      >
        <Text className="mr-4 text-3xl">{item.flag}</Text>

        <Text className="flex-1 text-base font-semibold text-neutral-black">
          {item.name}
        </Text>

        <Text className="font-bold text-neutral-gray">{item.dialCode}</Text>
      </TouchableOpacity>
    );

    return (
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="h-[70%] rounded-t-3xl bg-white p-4">
            {/* Header */}
            <View className="mb-2 flex-row items-center justify-between border-b border-gray-100 pb-4">
              <Text className="text-xl font-bold text-neutral-black">
                Select Country
              </Text>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={onClose}
                className="p-1"
              >
                <Ionicons name="close" size={24} color="#1C1C1E" />
              </TouchableOpacity>
            </View>

            {/* List - Optimized with FlatList */}
            <FlatList
              data={ALL_COUNTRIES}
              keyExtractor={(item) => item.code}
              renderItem={renderItem}
              showsVerticalScrollIndicator={false}
              initialNumToRender={15}
              maxToRenderPerBatch={20}
              windowSize={5}
              contentContainerClassName="pb-10"
            />
          </View>
        </View>
      </Modal>
    );
  },
);

CountryPickerModal.displayName = "CountryPickerModal";
