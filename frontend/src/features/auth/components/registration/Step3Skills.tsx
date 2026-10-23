import React, { useMemo, useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import { useAuthStore } from "@/src/features/auth/stores/auth.store";

import { SUGGESTED_SKILLS } from "../../data/skills.data";

/**
 * **Registration Step 3: Skills Selection**
 *
 * Allows users to search and select multiple professional skills from a predefined list.
 * This step refines the user profile for better networking matches.
 *
 * **Key Features:**
 * - **Real-time Search:** Filters the skill list instantly as the user types.
 * - **Multi-Selection:** Users can toggle multiple skills.
 * - **Validation:** Ensures at least one skill is selected before proceeding.
 *
 * @component
 * @returns {JSX.Element} The search bar and interactive skills grid.
 */
export const Step3Skills = () => {
  const { registrationData, setRegistrationData, validationErrors } =
    useAuthStore();

  const [search, setSearch] = useState("");

  /**
   * Toggles the presence of a skill in the registration state.
   * Adds the skill if missing; removes it if present.
   *
   * @param {string} skill - The skill identifier to toggle.
   */
  const toggleSkill = (skill: string) => {
    const current = registrationData.skills;
    if (current.includes(skill)) {
      setRegistrationData({ skills: current.filter((s) => s !== skill) });
    } else {
      setRegistrationData({ skills: [...current, skill] });
    }
  };

  /**
   * Memoized filter to prevent re-calculation on every render.
   * Only runs when 'search' string changes.
   */
  const filteredSkills = useMemo(() => {
    if (!search) return SUGGESTED_SKILLS;
    return SUGGESTED_SKILLS.filter((s) =>
      s.toLowerCase().includes(search.toLowerCase()),
    );
  }, [search]);

  return (
    <View className="w-full flex-1">
      {/* HEADER */}
      <View className="mb-6 items-center">
        <Text className="text-base text-neutral-gray">Almost there!</Text>
        <Text className="mb-4 text-center text-2xl font-bold text-primary">
          Add your skillsets
        </Text>

        {/* SEARCH BAR */}
        <View className="mb-2 h-[52px] w-full flex-row items-center rounded-xl border border-neutral-light bg-white px-4">
          <Ionicons name="search" size={20} color="#8E8E93" />
          <TextInput
            accessibilityLabel="Text input field"
            accessibilityHint="Filters the list of available skills below"
            className="ml-2 flex-1 text-neutral-black"
            placeholder="Search for skills"
            placeholderTextColor="#8E8E93"
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
          />
        </View>

        <View className="flex-row items-center self-start">
          <Ionicons
            name="information-circle-outline"
            size={16}
            color="#01A39F"
          />
          <Text className="ml-1 text-xs text-neutral-gray">
            Tap on a skill to select/remove it
          </Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* SKILLS GRID */}
        <View className="flex-row flex-wrap justify-start pb-4">
          {filteredSkills.map((item) => {
            const isSelected = registrationData.skills.includes(item);
            return (
              <TouchableOpacity
                accessibilityRole="button"
                key={item}
                onPress={() => toggleSkill(item)}
                activeOpacity={0.7}
                // Dynamic styling for selection state
                className={`m-1 rounded-full border px-4 py-2 ${
                  isSelected
                    ? "border-primary bg-primary"
                    : "border-neutral-light bg-white"
                }`}
              >
                <Text
                  className={`font-bold ${isSelected ? "text-white" : "text-neutral-gray"}`}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Validation Error Message */}
        {validationErrors.skills && (
          <View className="mt-2 items-center">
            <Text className="text-sm font-medium text-red-500">
              {validationErrors.skills}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};
