import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Stack, useRouter } from "expo-router";

import { Ionicons } from "@expo/vector-icons";

import { colors } from "@/constants/theme";

import { useGroupStore } from "../stores/groupStore";

export function CreateGroupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setCreateDraft, createDraft } = useGroupStore();
  
  const [imageLoading, setImageLoading] = useState(false);
  const [isNameFocused, setIsNameFocused] = useState(false);
  const [isDescFocused, setIsDescFocused] = useState(false);

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission needed",
        "Please allow photo library access to add a group photo.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });

    if (result.canceled || !result.assets[0]) return;

    setImageLoading(true);
    try {
      const base64Data = result.assets[0].base64;
      if (!base64Data) throw new Error("No base64 data");

      setCreateDraft({
        photoData: base64Data,
        photoMimeType: "image/jpeg",
      });
    } catch {
      Alert.alert("Error", "Failed to process image.");
    } finally {
      setImageLoading(false);
    }
  };

  const canContinue =
    createDraft.name.trim().length > 0 &&
    createDraft.description.trim().length > 0;

  const handleContinue = () => {
    if (!canContinue) return;
    router.push("/groups/select-members");
  };

  const photoSource = createDraft.photoData
    ? { uri: `data:image/jpeg;base64,${createDraft.photoData}` }
    : null;

  return (
    <View className="flex-1 bg-white">
      <Stack.Screen options={{ headerShown: false }} />

      {/* 1. Custom Header matching Figma */}
      <View
        className="flex-row items-center border-b border-surface-gray px-2 pb-3"
        style={{ paddingTop: Math.max(insets.top, 16) }}
      >
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => router.back()}
          className="z-10 p-3"
        >
          <Ionicons name="arrow-back" size={24} color={colors.neutral.DEFAULT} />
        </TouchableOpacity>
        <View
          className="absolute bottom-3 left-0 right-0 items-center"
          pointerEvents="none"
        >
          <Text className="font-nunito-bold text-[18px] text-neutral">
            Create a group
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: 32,
            paddingBottom: Math.max(insets.bottom, 24),
            alignItems: "center",
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* 2. Dashed Image Picker */}
          <TouchableOpacity
            accessibilityRole="button"
            className="mb-8 h-[120px] w-[120px] items-center justify-center overflow-hidden rounded-full border-[1.5px] border-dashed border-neutral-light bg-surface"
            onPress={handlePickImage}
            disabled={imageLoading}
            activeOpacity={0.8}
          >
            {imageLoading ? (
              <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
            ) : photoSource ? (
              <Image 
                source={photoSource} 
                style={{ width: 120, height: 120 }} 
                contentFit="cover" 
              />
            ) : (
              <View className="items-center">
                <Ionicons name="camera" size={32} color={colors.neutral.light} />
                <Text className="mt-1 font-nunito text-[12px] text-neutral-light">
                  Add Photo
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* 3. Clean Inputs (No external labels) */}
          <View className="w-full">
            <TextInput
              accessibilityLabel="Group Name Input"
              className={`mb-4 w-full rounded-lg border px-4 py-4 font-nunito text-[15px] text-neutral ${
                isNameFocused ? "border-primary" : "border-surface-gray"
              }`}
              placeholder="Name this group"
              placeholderTextColor={colors.neutral.light}
              value={createDraft.name}
              onChangeText={(text) => setCreateDraft({ name: text })}
              onFocus={() => setIsNameFocused(true)}
              onBlur={() => setIsNameFocused(false)}
              maxLength={80}
              returnKeyType="next"
            />

            <TextInput
              accessibilityLabel="Group Description Input"
              className={`mb-6 min-h-[120px] w-full rounded-lg border px-4 py-4 font-nunito text-[15px] text-neutral ${
                isDescFocused ? "border-primary" : "border-surface-gray"
              }`}
              placeholder="Add a description"
              placeholderTextColor={colors.neutral.light}
              value={createDraft.description}
              onChangeText={(text) => setCreateDraft({ description: text })}
              onFocus={() => setIsDescFocused(true)}
              onBlur={() => setIsDescFocused(false)}
              maxLength={500}
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* 4. Figma CTA Button */}
          <TouchableOpacity
            accessibilityRole="button"
            className={`mt-2 flex-row w-full items-center justify-center rounded-lg py-[14px] ${
              canContinue ? "bg-primary" : "bg-primary/50"
            }`}
            onPress={handleContinue}
            disabled={!canContinue}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={20} color="#fff" className="mr-1" />
            <Text className="font-nunito-semibold text-[16px] text-white">
              Add People
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

export default CreateGroupScreen;