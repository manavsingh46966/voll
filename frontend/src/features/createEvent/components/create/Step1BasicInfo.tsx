import React, { useState } from "react";
import {
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";

import { Ionicons } from "@expo/vector-icons";

import { colors } from "@/constants/theme";
import { FloatingInput } from "@/src/components/ui/FloatingInput";
import { LocationSearchModal } from "@/src/features/createEvent/components/location/LocationSearchModal";

import { useCreateEventStore } from "../../stores/createEvent.store";
import type { EventLocation } from "../../types/event.types";
import { CoverPhotoPicker } from "../CoverPhotoPicker";

/**
 * Supported categories that can be assigned to a new volunteer event.
 */
const CATEGORIES = [
  "Workshop",
  "Seminar",
  "Meetup",
  "Festival",
  "Seva",
  "Cleanup",
  "Other",
];

/**
 * The minimum number of characters required for the event's description field.
 */
const MIN_DESC_CHARS = 150;

/**
 * Step1BasicInfo is a wizard step component that gathers basic information about the event:
 * - Cover Photo (uses {@link CoverPhotoPicker})
 * - Event Title (text input)
 * - Event Description (multiline text input with character limit countdown helper)
 * - Event Category (custom dropdown using standard selectable options)
 * - Event Tags (tag input adder with quick delete options)
 * - Virtual status toggle (determines whether location maps or meeting links are shown)
 * - Location selector (opens search modal {@link LocationSearchModal} and redirects to details maps)
 *
 * @returns {React.JSX.Element} A ScrollView layout containing the basic information inputs.
 */
export function Step1BasicInfo() {
  const { formData, updateData } = useCreateEventStore();
  const [showCategories, setShowCategories] = useState(false);
  const [showLocationSearch, setShowLocationSearch] = useState(false);
  const [tagInput, setTagInput] = useState("");

  const remaining = Math.max(
    0,
    MIN_DESC_CHARS - (formData.description?.length ?? 0),
  );

  /**
   * Sanitizes, formats, and adds the current `tagInput` string to the global store's tags array.
   * Replaces spaces with hyphens, converts text to lowercase, and prevents duplicate tags.
   *
   * @returns {void}
   */
  const addTag = () => {
    const tag = tagInput.trim().toLowerCase().replace(/\s+/g, "-");
    if (tag && !formData.tags.includes(tag))
      updateData({ tags: [...formData.tags, tag] });
    setTagInput("");
  };

  /**
   * Closes the location search overlay modal and routes the user to the modal location map
   * (`/(modals)/event-location-map`) with the selected location details serialized in the query.
   *
   * @param {EventLocation} location The location coordinate and name object selected by the user.
   * @returns {void}
   */
  const openLocationMap = (location: EventLocation) => {
    setShowLocationSearch(false);
    router.push({
      pathname: "/(modals)/event-location-map",
      params: { location: JSON.stringify(location) },
    });
  };

  const locationTitle = formData.location?.name || "Select event location";
  const locationSubtitle =
    formData.location?.address ||
    (formData.location?.latitude && formData.location?.longitude
      ? `${formData.location.latitude.toFixed(6)}, ${formData.location.longitude.toFixed(6)}`
      : "Search a place or use your current location");

  return (
    <ScrollView
      className="flex-1"
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
      <CoverPhotoPicker
        coverPhotoUrl={formData.coverPhotoUrl}
        onPhotoSelected={(uri, base64) =>
          updateData({ coverPhotoUrl: uri, coverPhotoBase64: base64 })
        }
      />

      <View className="gap-y-5 px-4 pt-6">
        <FloatingInput
          label="Title"
          value={formData.title}
          onChangeText={(t) => updateData({ title: t })}
        />

        <View>
          <FloatingInput
            label={`Description (minimum ${MIN_DESC_CHARS} chars)`}
            value={formData.description}
            onChangeText={(t) => updateData({ description: t })}
            multiline
            className="h-32"
            textAlignVertical="top"
          />
          {remaining > 0 && (
            <Text className="mt-1 px-1 font-nunito text-[11px] text-neutral-light">
              {remaining} more character{remaining !== 1 ? "s" : ""} needed
            </Text>
          )}
        </View>

        <View>
          <TouchableOpacity
            accessibilityRole="button"
            className="flex-row items-center justify-between rounded-xl border border-neutral-lightest px-3 py-3"
            onPress={() => setShowCategories(!showCategories)}
          >
            <Text
              className={`font-nunito text-[15px] ${formData.category ? "text-neutral" : "text-neutral-light"}`}
            >
              {formData.category || "Select event category"}
            </Text>
            <Ionicons
              name={showCategories ? "chevron-up" : "chevron-down"}
              size={18}
              color={colors.neutral.light}
            />
          </TouchableOpacity>
          {showCategories && (
            <View className="mt-1 overflow-hidden rounded-xl border border-neutral-lightest">
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  accessibilityRole="button"
                  key={cat}
                  className={`border-b border-neutral-lightest px-4 py-3 ${formData.category === cat ? "bg-primary-surface" : ""}`}
                  onPress={() => {
                    updateData({ category: cat });
                    setShowCategories(false);
                  }}
                >
                  <Text
                    className={`font-nunito text-[15px] ${formData.category === cat ? "font-nunito-semibold text-primary" : "text-neutral"}`}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View className="rounded-xl border border-neutral-lightest px-3 py-2">
          <Text className="mb-2 font-nunito-semibold text-[11px] text-neutral-light">
            Tags
          </Text>
          <View className="mb-2 flex-row flex-wrap gap-2">
            {formData.tags.map((tag) => (
              <TouchableOpacity
                accessibilityRole="button"
                key={tag}
                className="flex-row items-center gap-x-1 rounded-full bg-primary-surface px-3 py-1"
                onPress={() =>
                  updateData({ tags: formData.tags.filter((t) => t !== tag) })
                }
              >
                <Text className="font-nunito text-[13px] text-primary">
                  #{tag}
                </Text>
                <Ionicons
                  name="close"
                  size={12}
                  color={colors.primary.DEFAULT}
                />
              </TouchableOpacity>
            ))}
          </View>
          <View className="flex-row items-center gap-x-2">
            <TextInput
              accessibilityLabel="Text input field"
              className="flex-1 font-nunito text-[14px] text-neutral"
              value={tagInput}
              onChangeText={setTagInput}
              onSubmitEditing={addTag}
              placeholder="Add a tag and press enter"
              placeholderTextColor={colors.neutral.light}
              returnKeyType="done"
            />
            <TouchableOpacity accessibilityRole="button" onPress={addTag}>
              <Ionicons
                name="add-circle"
                size={24}
                color={colors.primary.DEFAULT}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View className="border-b border-t border-neutral-lightest py-4">
          <View className="flex-row items-center">
            <Text className="flex-1 font-nunito text-[15px] text-neutral">
              Virtual Event
            </Text>
            <Switch
              trackColor={{
                false: colors.neutral.lightest,
                true: colors.primary.DEFAULT,
              }}
              thumbColor="#fff"
              value={formData.isVirtual}
              onValueChange={(val) =>
                updateData({
                  isVirtual: val,
                  virtualLink: val ? formData.virtualLink : "",
                })
              }
            />
          </View>
        </View>

        {formData.isVirtual ? (
          <FloatingInput
            label="Virtual Meeting Link"
            value={formData.virtualLink}
            onChangeText={(t) => updateData({ virtualLink: t })}
            autoCapitalize="none"
            keyboardType="url"
          />
        ) : (
          <TouchableOpacity
            accessibilityRole="button"
            className="flex-row items-center rounded-xl border border-neutral-lightest px-3 py-3"
            onPress={() => setShowLocationSearch(true)}
            activeOpacity={0.8}
          >
            <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-primary-surface">
              <Ionicons
                name="location"
                size={20}
                color={colors.primary.DEFAULT}
              />
            </View>
            <View className="flex-1">
              <Text className="mb-1 font-nunito-semibold text-[11px] text-neutral-light">
                Location
              </Text>
              <Text className="font-nunito-semibold text-[15px] text-neutral">
                {locationTitle}
              </Text>
              <Text className="mt-1 font-nunito text-[13px] text-neutral-light">
                {locationSubtitle}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.neutral.light}
            />
          </TouchableOpacity>
        )}
        <View className="h-10" />
      </View>

      <LocationSearchModal
        visible={showLocationSearch}
        onClose={() => setShowLocationSearch(false)}
        onSelectLocation={openLocationMap}
      />
    </ScrollView>
  );
}
