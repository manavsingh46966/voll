import React, { useState } from "react";
import { Platform, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";

// Components
import { Button } from "@/src/components/ui/Button";
import {
  CountryPickerModal,
  CountrySelectorBtn,
} from "@/src/features/auth/components/ui/CountryPicker";
// Data & Logic
import { ALL_COUNTRIES, Country } from "@/src/features/auth/data/countries";
import { usePhoneAuth } from "@/src/features/auth/hooks/usePhoneAuth";

/**
 * **Phone Number Entry Screen**
 *
 * The initial step of the Phone Authentication flow.
 * It allows the user to select a country code and enter their mobile number.
 *
 * **Key Features:**
 * - **Country Picker:** Modal interface to select international dial codes.
 * - **Formatting:** Automatically strips non-numeric characters and formats to E.164 (e.g., +15550000).
 * - **Web Compatibility:** Renders a hidden `recaptcha-container` div when running on the Web platform.
 *
 * @component
 * @returns {JSX.Element} The phone entry UI with country selector.
 */
export default function PhoneScreen() {
  const [phoneNumber, setPhoneNumber] = useState("");
  // Default to first country (usually India +91 based on your data)
  const [selectedCountry, setSelectedCountry] = useState<Country>(
    ALL_COUNTRIES[0],
  );
  const [showPicker, setShowPicker] = useState(false);

  const { sendOTP, loading } = usePhoneAuth();

  const handleSendOtp = () => {
    // E.164 Format: +[CountryCode][Number]
    const fullNumber = `${selectedCountry.dialCode}${phoneNumber}`;
    sendOTP(fullNumber);
  };

  return (
    <SafeAreaView className="flex-1 bg-white px-6">
      {/* Add Navigation Header 
        We use Stack.Screen to configure the native header, giving us a free "Back" button.
      */}
      <Stack.Screen
        options={{
          title: "",
          headerBackTitle: "Back",
          headerShown: true, // Ensure native back button appears
          headerTransparent: true,
        }}
      />

      {/* Container to constrain width on large screens */}
      <View className="mx-auto w-full max-w-md flex-1 pt-12">
        {/* Header Section */}
        <Text className="mb-2 text-center text-2xl font-bold text-primary">
          Phone Verification
        </Text>
        <Text className="mb-10 text-center text-base text-neutral-gray">
          We will send an OTP to verify this number.
        </Text>

        {/* Input Row */}
        <View className="mb-8 flex-row items-center">
          <CountrySelectorBtn
            selected={selectedCountry}
            onPress={() => setShowPicker(true)}
          />

          <TextInput
            accessibilityLabel="Text input field"
            accessibilityHint="Enter your mobile number without the country code"
            className="h-[52px] flex-1 rounded-xl border border-neutral-light bg-white px-4 text-base text-neutral-black focus:border-primary"
            placeholder="Enter Phone Number"
            placeholderTextColor="#8E8E93"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={(text) => setPhoneNumber(text.replace(/[^0-9]/g, ""))} // Validation: Numbers only
            autoFocus={Platform.OS !== "web"}
            autoComplete="tel"
            textContentType="telephoneNumber"
          />
        </View>

        {/* Action Button */}
        <Button
          title="Send OTP"
          onPress={handleSendOtp}
          loading={loading}
          disabled={phoneNumber.length < 5 || loading}
        />

        {/* Modals & Overlays */}
        <CountryPickerModal
          visible={showPicker}
          onClose={() => setShowPicker(false)}
          onSelect={setSelectedCountry}
        />

        {/* CRITICAL FOR WEB: 
          Firebase RecaptchaVerifier looks for an element with ID 'recaptcha-container'.
          React Native Web maps 'nativeID' to the HTML 'id' attribute.
        */}
        {Platform.OS === "web" && (
          <View nativeID="recaptcha-container" className="mt-4" />
        )}
      </View>
    </SafeAreaView>
  );
}
