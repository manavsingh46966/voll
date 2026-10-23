import React, { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";

import { Ionicons } from "@expo/vector-icons";

import { useAuthStore } from "@/src/features/auth/stores/auth.store";

const GENDER_OPTIONS = ["Male", "Female", "Other"];

/**
 * **Registration Step 1: Personal Details**
 *
 * This component handles the collection of the user's core identity information.
 * It is the first screen in the multi-step registration wizard.
 *
 * **Key Features:**
 * - **Auto-Population:** Automatically pre-fills Email (if Google Auth) or Phone (if OTP Auth) to prevent editing of verified credentials.
 * - **Media Handling:** Integrates `expo-image-picker` for profile photo selection.
 * - **Validation Feedback:** Displays inline error messages using the shared `validationErrors` store.
 * - **Custom Inputs:** Features a custom dropdown implementation for Gender selection.
 *
 * @component
 * @example
 * // Rendered within the Registration Wizard
 * {currentStep === 1 && <Step1PersonalDetails />}
 *
 * @returns {JSX.Element} The scrollable form for personal information.
 */
export const Step1PersonalDetails = () => {
  const {
    registrationData,
    setRegistrationData,
    signupData,
    validationErrors,
  } = useAuthStore();
  const [isGenderOpen, setIsGenderOpen] = useState(false);

  const isGoogleAuth = !!signupData.googleData?.email;
  const isPhoneAuth = !!signupData.firebaseUser?.phoneNumber;

  // Fix: Added dependencies to satisfy linter
  useEffect(() => {
    if (!registrationData.email && signupData.googleData?.email) {
      setRegistrationData({ email: signupData.googleData.email });
    }
    if (!registrationData.phone && signupData.firebaseUser?.phoneNumber) {
      setRegistrationData({ phone: signupData.firebaseUser.phoneNumber });
    }
    if (!registrationData.profileImage && signupData.googleData?.photoURL) {
      setRegistrationData({ profileImage: signupData.googleData.photoURL });
    }
  }, [
    registrationData.email,
    registrationData.phone,
    registrationData.profileImage,
    signupData.googleData,
    signupData.firebaseUser,
    setRegistrationData,
  ]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled) {
      setRegistrationData({ profileImage: result.assets[0].uri });
    }
  };

  const getBorderColor = (field: string) =>
    validationErrors[field] ? "border-red-500" : "border-neutral-light";

  // Refactored to save lines
  const renderError = (field: string) =>
    validationErrors[field] ? (
      <Text className="ml-1 mt-1 text-xs text-red-500">
        {validationErrors[field]}
      </Text>
    ) : null;

  // Helper to reduce repetition and fix Accessibility Errors
  const renderInput = (
    field: keyof typeof registrationData,
    placeholder: string,
    options: { keyboard?: "default" | "number-pad"; editable?: boolean } = {},
  ) => (
    <View className="mb-4">
      <TextInput
        accessibilityLabel={placeholder}
        accessibilityHint={`Enter your ${placeholder}`}
        placeholder={placeholder}
        keyboardType={options.keyboard || "default"}
        editable={options.editable !== false}
        className={`h-[52px] rounded-lg border px-4 text-neutral-black ${
          options.editable === false ? "bg-gray-100 text-gray-500" : "bg-white"
        } ${getBorderColor(field)}`}
        value={registrationData[field] as string}
        onChangeText={(t) => setRegistrationData({ [field]: t })}
      />
      {renderError(field)}
    </View>
  );

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerClassName="pb-24"
      className="flex-1"
      keyboardShouldPersistTaps="handled"
    >
      <View className="mb-8 items-center">
        <Text className="mb-1 text-2xl font-bold text-primary">
          Welcome to Volstory
        </Text>
        <Text className="mb-6 text-base text-neutral-gray">
          Let&apos;s get you registered
        </Text>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Profile Photo"
          accessibilityHint="Opens gallery to select a profile photo"
          onPress={pickImage}
          activeOpacity={0.8}
        >
          <View
            className={`h-28 w-28 items-center justify-center overflow-hidden rounded-full border border-dashed bg-gray-100 ${getBorderColor("profileImage")}`}
          >
            {registrationData.profileImage ? (
              <Image
                source={{ uri: registrationData.profileImage }}
                className="h-full w-full"
              />
            ) : (
              <View className="items-center">
                <Ionicons name="camera" size={32} color="#8E8E93" />
                <Text className="mt-1 text-xs text-neutral-gray">
                  Add Photo
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
        {renderError("profileImage")}
      </View>

      <View className="gap-2">
        {/* ROW 1: Names */}
        <View className="flex-row gap-4">
          <View className="flex-1">
            {renderInput("firstName", "First Name")}
          </View>
          <View className="flex-1">{renderInput("lastName", "Last Name")}</View>
        </View>

        {/* ROW 2: Age & Gender */}
        <View className="z-50 flex-row gap-4">
          <View className="flex-1">
            {renderInput("age", "Age", { keyboard: "number-pad" })}
          </View>

          <View className="relative z-50 flex-1">
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Gender Selector"
              accessibilityHint="Opens a dropdown to select gender"
              activeOpacity={0.8}
              onPress={() => setIsGenderOpen(!isGenderOpen)}
              className={`h-[52px] flex-row items-center justify-between rounded-lg border bg-white px-4 ${getBorderColor("gender")}`}
            >
              <Text
                className={
                  registrationData.gender
                    ? "text-neutral-black"
                    : "text-gray-400"
                }
              >
                {registrationData.gender || "Gender"}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#8E8E93" />
            </TouchableOpacity>
            {renderError("gender")}

            {isGenderOpen && (
              <View className="absolute left-0 right-0 top-[56px] z-50 rounded-lg border border-neutral-light bg-white shadow-lg">
                {GENDER_OPTIONS.map((option) => (
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={option}
                    accessibilityHint={`Selects ${option} as gender`}
                    key={option}
                    onPress={() => {
                      setRegistrationData({ gender: option });
                      setIsGenderOpen(false);
                    }}
                    className="border-b border-gray-100 px-4 py-3"
                  >
                    <Text className="text-neutral-black">{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        {renderInput("city", "City")}

        {/* Read-Only Fields */}
        {renderInput("phone", "Phone Number", { editable: !isPhoneAuth })}
        {renderInput("email", "Email", { editable: !isGoogleAuth })}
        {renderInput("website", "Website (Optional)")}
      </View>
    </ScrollView>
  );
};
