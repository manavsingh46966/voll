import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

import { useAuthStore } from "@/src/features/auth/stores/auth.store";

import { SUGGESTED_INTERESTS } from "../../data/interests.data";

/**
 * **Registration Step 2: Interest Selection**
 *
 * Presents a grid of interactive chips allowing the user to select their preferred topics.
 * This data helps personalize the user's feed and experience.
 *
 * **Key Features:**
 * - **Toggle Interaction:** Users can tap chips to add or remove interests from the list.
 * - **Visual Feedback:** Selected items are highlighted with the primary brand color.
 * - **Validation:** Displays error messages if the selection criteria (min 1) is not met.
 *
 * @component
 * @returns {JSX.Element} The scrollable grid of interest chips.
 */
export const Step2Interests = () => {
  const { registrationData, setRegistrationData, validationErrors } =
    useAuthStore();

  /**
   * Toggles a specific interest within the registration state.
   * - If the interest exists, it is removed.
   * - If the interest is new, it is appended to the array.
   *
   * @param {string} interest - The unique identifier/name of the interest topic.
   */
  const toggleInterest = (interest: string) => {
    const current = registrationData.interests;

    if (current.includes(interest)) {
      // Remove
      setRegistrationData({
        interests: current.filter((i) => i !== interest),
      });
    } else {
      // Add
      // Optional: Add a limit check here (e.g., if (current.length >= 10) return;)
      setRegistrationData({
        interests: [...current, interest],
      });
    }
  };

  return (
    <View className="w-full flex-1">
      {/* HEADER */}
      <View className="mb-8 items-center">
        <Text className="mb-1 text-center text-2xl font-bold text-primary">
          Pick topics that interest you
        </Text>
        <Text className="text-center text-base text-neutral-gray">
          This helps us understand you better
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* GRID OF CHIPS */}
        <View className="flex-row flex-wrap justify-center pb-4">
          {SUGGESTED_INTERESTS.map((item) => {
            const isSelected = registrationData.interests.includes(item);

            return (
              <TouchableOpacity
                accessibilityRole="button"
                key={item}
                onPress={() => toggleInterest(item)}
                activeOpacity={0.7}
                // Dynamic Style: Changes background and border based on selection
                className={`m-1 rounded-full border px-4 py-2 ${
                  isSelected
                    ? "border-primary bg-primary"
                    : "border-primary bg-white"
                }`}
              >
                <Text
                  className={`font-bold ${isSelected ? "text-white" : "text-primary"}`}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Validation Error Message */}
        {/* If the user tries to proceed without selecting, this shows up. */}
        {validationErrors.interests && (
          <View className="mt-2 items-center">
            <Text className="text-sm font-medium text-red-500">
              {validationErrors.interests}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};
