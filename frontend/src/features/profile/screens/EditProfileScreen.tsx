import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import { colors } from "@/constants/theme";

import { ProfileHeader } from "../components/ProfileHeader";
import { useMyProfile, useUpdateProfile } from "../hooks/useProfile";
import type { UpdateProfilePayload } from "../types/profile.types";

// ---------------------------------------------------------------------------
// Field components
// ---------------------------------------------------------------------------

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  maxLength,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  maxLength?: number;
}) {
  return (
    <View className="mb-5">
      <Text className="mb-1.5 text-sm font-semibold text-neutral-light">
        {label}
      </Text>
      <TextInput
        accessibilityLabel="Text input field"
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.neutral.lightest}
        maxLength={maxLength}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        className="rounded-xl px-4 text-base text-neutral"
        style={{
          backgroundColor: colors.surface.DEFAULT,
          borderWidth: 1,
          borderColor: colors.neutral.lightest,
          paddingVertical: 12,
          minHeight: multiline ? 90 : undefined,
          textAlignVertical: multiline ? "top" : "center",
        }}
      />
      {maxLength && (
        <Text className="mt-1 text-right text-xs text-neutral-lightest">
          {value.length}/{maxLength}
        </Text>
      )}
    </View>
  );
}

function ToggleRow({
  label,
  value,
  onToggle,
}: {
  label: string;
  value: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <View
      className="flex-row items-center justify-between px-1 py-3"
      style={{
        borderBottomWidth: 1,
        borderBottomColor: colors.neutral.lightest,
      }}
    >
      <Text className="text-base text-neutral">{label}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{
          false: colors.neutral.lightest,
          true: colors.primary.DEFAULT,
        }}
        ios_backgroundColor={colors.neutral.lightest}
      />
    </View>
  );
}

function ChipList({
  items,
  onRemove,
}: {
  items: string[];
  onRemove: (item: string) => void;
}) {
  if (items.length === 0) {
    return (
      <Text className="mb-2 text-sm text-neutral-lightest">
        None added yet.
      </Text>
    );
  }
  return (
    <View className="mb-2 flex-row flex-wrap">
      {items.map((item) => (
        <Pressable
          key={item}
          onPress={() => onRemove(item)}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${item}`}
          className="m-1 flex-row items-center rounded-2xl px-3 py-1.5"
          style={{ backgroundColor: colors.primary.DEFAULT + "1A" }}
        >
          <Text
            className="text-sm font-semibold"
            style={{ color: colors.primary.DEFAULT }}
          >
            {item}
          </Text>
          <Text
            className="ml-1.5 text-xs"
            style={{ color: colors.primary.DEFAULT }}
          >
            ✕
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function AddChipInput({
  placeholder,
  onAdd,
}: {
  placeholder: string;
  onAdd: (value: string) => void;
}) {
  const [text, setText] = useState("");

  const handleAdd = () => {
    const trimmed = text.trim();
    if (trimmed.length < 1) return;
    onAdd(trimmed);
    setText("");
  };

  return (
    <View className="flex-row items-center gap-2">
      <TextInput
        accessibilityLabel="Text input field"
        value={text}
        onChangeText={setText}
        placeholder={placeholder}
        placeholderTextColor={colors.neutral.lightest}
        returnKeyType="done"
        onSubmitEditing={handleAdd}
        className="flex-1 rounded-xl px-4 py-2.5 text-sm text-neutral"
        style={{
          borderWidth: 1,
          borderColor: colors.neutral.lightest,
          backgroundColor: colors.surface.DEFAULT,
        }}
      />
      <Pressable
        onPress={handleAdd}
        accessibilityRole="button"
        accessibilityLabel="Add item"
        className="rounded-xl px-4 py-2.5"
        style={{ backgroundColor: colors.primary.DEFAULT }}
      >
        <Text className="font-nunito-bold text-sm text-white">Add</Text>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Gender picker (simple inline buttons)
// ---------------------------------------------------------------------------

const GENDERS = ["Male", "Female", "Other"] as const;

function GenderPicker({
  selected,
  onChange,
}: {
  selected: string | null;
  onChange: (v: string) => void;
}) {
  return (
    <View className="mb-5">
      <Text className="mb-1.5 text-sm font-semibold text-neutral-light">
        Gender
      </Text>
      <View className="flex-row gap-2">
        {GENDERS.map((g) => {
          const isActive = selected === g;
          return (
            <Pressable
              key={g}
              onPress={() => onChange(g)}
              accessibilityRole="radio"
              accessibilityState={{ selected: isActive }}
              className="rounded-xl px-4 py-2"
              style={{
                borderWidth: 1.5,
                borderColor: isActive
                  ? colors.primary.DEFAULT
                  : colors.neutral.lightest,
                backgroundColor: isActive
                  ? colors.primary.DEFAULT + "15"
                  : undefined,
              }}
            >
              <Text
                className="text-sm font-semibold"
                style={{
                  color: isActive
                    ? colors.primary.DEFAULT
                    : colors.neutral.light,
                }}
              >
                {g}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main EditProfileScreen
// ---------------------------------------------------------------------------

/**
 * **Edit Profile Screen**
 * Full form for updating all editable profile fields.
 * Pre-populates from the cached 'me' profile.
 * On save, calls `useUpdateProfile` mutation and navigates back.
 */
export default function EditProfileScreen() {
  const { data: profile, isLoading } = useMyProfile();
  const updateMutation = useUpdateProfile();

  // --- Form state ---
  const [name, setName] = useState("");
  const [gender, setGender] = useState<string | null>(null);
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [website, setWebsite] = useState("");
  const [skillsets, setSkillsets] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [showMobileNumber, setShowMobileNumber] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [showWebsite, setShowWebsite] = useState(false);

  // Pre-fill form when profile data arrives
  useEffect(() => {
    if (profile) {
      setName(profile.name ?? "");
      setGender(profile.gender);
      setBio(profile.bio ?? "");
      setCity(profile.city ?? "");
      setWebsite(profile.website ?? "");
      setSkillsets(profile.skillsets ?? []);
      setInterests(profile.interests ?? []);
      setShowMobileNumber(profile.showMobileNumber ?? false);
      setShowEmail(profile.showEmail ?? false);
      setShowWebsite(profile.showWebsite ?? false);
    }
  }, [profile]);

  const handleSave = async () => {
    const payload: UpdateProfilePayload = {
      name: name.trim() || undefined,
      gender: (gender as UpdateProfilePayload["gender"]) ?? null,
      bio: bio.trim(),
      city: city.trim() || null,
      website: website.trim() || null,
      skillsets,
      interests,
      showMobileNumber,
      showEmail,
      showWebsite,
    };

    try {
      await updateMutation.mutateAsync(payload);
      Alert.alert("Success", "Profile updated successfully!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert("Error", "Could not save profile. Please try again.");
    }
  };

  if (isLoading || !profile) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["bottom"]}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 60 }}
        >
          {/* Avatar (read-only here; photo editing is a future feature) */}
          <ProfileHeader
            name={profile.name}
            gender={profile.gender}
            profileImageUrl={profile.profileImageUrl}
            isEditable={false}
          />

          <View className="px-5">
            {/* Basic Info */}
            <Text className="mb-4 mt-2 font-nunito-bold text-lg text-neutral">
              Basic Info
            </Text>

            <FormField
              label="Name"
              value={name}
              onChangeText={setName}
              placeholder="Your full name"
              maxLength={80}
            />

            <GenderPicker selected={gender} onChange={setGender} />

            <FormField
              label="Bio"
              value={bio}
              onChangeText={setBio}
              placeholder="Tell the world about yourself…"
              multiline
              maxLength={500}
            />

            <FormField
              label="City"
              value={city}
              onChangeText={setCity}
              placeholder="Your city"
              maxLength={100}
            />

            {/* Contact & Privacy */}
            <Text className="mb-4 mt-2 font-nunito-bold text-lg text-neutral">
              Contact & Privacy
            </Text>

            <View
              className="mb-5 rounded-2xl bg-surface px-4"
              style={{ borderWidth: 1, borderColor: colors.neutral.lightest }}
            >
              {/* Phone — read-only, only toggle visibility */}
              <View
                className="py-3"
                style={{
                  borderBottomWidth: 1,
                  borderBottomColor: colors.neutral.lightest,
                }}
              >
                <Text className="text-xs text-neutral-light">Phone Number</Text>
                <Text className="mt-0.5 text-base text-neutral">
                  {profile.phoneNumber ?? "Not available"}
                </Text>
              </View>
              <ToggleRow
                label="Show phone number publicly"
                value={showMobileNumber}
                onToggle={setShowMobileNumber}
              />
              <ToggleRow
                label="Show email publicly"
                value={showEmail}
                onToggle={setShowEmail}
              />
            </View>

            <View className="mb-5">
              <FormField
                label="Website"
                value={website}
                onChangeText={setWebsite}
                placeholder="https://yourwebsite.com"
                maxLength={200}
              />
              <ToggleRow
                label="Show website publicly"
                value={showWebsite}
                onToggle={setShowWebsite}
              />
            </View>

            {/* Skills */}
            <Text className="mb-3 font-nunito-bold text-lg text-neutral">
              Skills
            </Text>
            <ChipList
              items={skillsets}
              onRemove={(item) =>
                setSkillsets((prev) => prev.filter((s) => s !== item))
              }
            />
            <AddChipInput
              placeholder="Add a skill (e.g. Photography)"
              onAdd={(v) => {
                if (!skillsets.includes(v) && skillsets.length < 20)
                  setSkillsets((prev) => [...prev, v]);
              }}
            />

            {/* Interests */}
            <Text className="mb-3 mt-6 font-nunito-bold text-lg text-neutral">
              Interests
            </Text>
            <ChipList
              items={interests}
              onRemove={(item) =>
                setInterests((prev) => prev.filter((i) => i !== item))
              }
            />
            <AddChipInput
              placeholder="Add an interest (e.g. Hiking)"
              onAdd={(v) => {
                if (!interests.includes(v) && interests.length < 20)
                  setInterests((prev) => [...prev, v]);
              }}
            />

            {/* Save button */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Save profile changes"
              onPress={handleSave}
              disabled={updateMutation.isPending}
              className="mt-8 items-center rounded-2xl py-4"
              style={{
                backgroundColor: updateMutation.isPending
                  ? colors.neutral.lightest
                  : colors.primary.DEFAULT,
              }}
            >
              {updateMutation.isPending ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="font-nunito-bold text-base text-white">
                  Save Changes
                </Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
