import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import { Ionicons } from "@expo/vector-icons";

import { colors } from "@/constants/theme";

import { CreateEventFlow } from "../components/create/CreateEventFlow";
import { useCreateEventStore } from "../stores/createEvent.store";

/**
 * CreateEventScreen component renders the main container for the multi-step event creation flow.
 * It provides the top navigation header containing back/close actions and orchestrates
 * the transition between different screens/steps via `CreateEventFlow`.
 *
 * This screen interacts with the `useCreateEventStore` Zustand store to check the current step
 * of the flow, navigate backward, and clean up temporary state if the user decides to cancel.
 *
 * @returns {React.JSX.Element} The rendered safe area view containing the event creation header and flow.
 */
export function CreateEventScreen() {
  const { step, prevStep, clearDraft } = useCreateEventStore();

  /**
   * Handles navigation when the user clicks the back button.
   * If the current wizard step is greater than 1, it decrements the step using `prevStep` from the store.
   * Otherwise, it pops the current screen from the router stack to return to the previous screen.
   *
   * @returns {void}
   */
  const handleBack = () => {
    if (step > 1) {
      prevStep();
    } else {
      router.back();
    }
  };

  /**
   * Handles the closing of the event creation flow.
   * Clears the draft in the Zustand store (`clearDraft`) to ensure subsequent visits
   * start from a fresh slate, and then navigates back in the router.
   *
   * @returns {void}
   */
  const handleClose = () => {
    clearDraft();
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1">
        <View className="flex-row items-center border-b border-neutral-lightest px-3 py-3">
          <TouchableOpacity
            accessibilityRole="button"
            onPress={handleBack}
            className="h-9 w-9 items-center justify-center"
            activeOpacity={0.7}
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color={colors.neutral.DEFAULT}
            />
          </TouchableOpacity>
          <Text className="flex-1 text-center font-nunito-bold text-[17px] text-neutral">
            Create Event
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={handleClose}
            className="h-9 w-9 items-center justify-center"
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={22} color={colors.neutral.light} />
          </TouchableOpacity>
        </View>

        <CreateEventFlow />
      </View>
    </SafeAreaView>
  );
}
