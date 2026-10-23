import React from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  Text,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";

import { colors } from "@/constants/theme";

interface BannerChange {
  previewUrl?: string;
  bannerImageData?: string;
  bannerImageMimeType?: string;
  removed?: boolean;
}

interface BannerImageFieldProps {
  value?: string;
  disabled?: boolean;
  onChange: (value: BannerChange) => void;
}

const MAX_BASE64_LENGTH = 2_000_000;

/**
 * Renders the banner image picker and preview.
 *
 * @param root0 - Banner image field props.
 * @param root0.value - Current preview image URI.
 * @param root0.disabled - Whether the field is disabled.
 * @param root0.onChange - Callback fired with the selected banner image.
 * @returns The banner image field.
 */
export default function BannerImageField({
  value,
  disabled,
  onChange,
}: BannerImageFieldProps) {
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handlePickImage = async () => {
    if (disabled || isProcessing) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission Required", "Please allow photo library access.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.72,
      base64: true,
      exif: false,
    });

    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];
    if (!asset.uri || !asset.width || !asset.height) {
      Alert.alert("Invalid Image", "Please select a different image.");
      return;
    }

    setIsProcessing(true);
    try {
      if (!asset.base64) {
        Alert.alert("Image Error", "Unable to process this image.");
        return;
      }

      if (asset.base64.length > MAX_BASE64_LENGTH) {
        Alert.alert(
          "Image Too Large",
          "Please choose a smaller image for the banner.",
        );
        return;
      }

      const mimeType = asset.mimeType || "image/jpeg";
      const dataUrl = `data:${mimeType};base64,${asset.base64}`;
      onChange({
        previewUrl: dataUrl,
        bannerImageData: asset.base64,
        bannerImageMimeType: mimeType,
        removed: false,
      });
    } catch {
      Alert.alert("Image Error", "Unable to prepare banner image.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemove = () => {
    if (disabled || isProcessing) return;
    onChange({
      previewUrl: undefined,
      bannerImageData: "",
      bannerImageMimeType: "",
      removed: true,
    });
  };

  return (
    <View className="space-y-2">
      <Text className="font-nunito-semibold text-small text-neutral-dark">
        Banner Image
      </Text>

      {value ? (
        <View className="overflow-hidden rounded-2xl border border-surface-gray bg-surface">
          <Image source={{ uri: value }} className="h-44 w-full" />
        </View>
      ) : (
        <View className="items-center justify-center rounded-2xl border border-dashed border-surface-gray bg-surface px-4 py-10">
          <Text className="text-small text-neutral-gray">
            Select a wide image and crop it to 16:9.
          </Text>
        </View>
      )}

      <View className="flex-row gap-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Choose banner image"
          accessibilityHint="Opens your photo library to select a story banner"
          onPress={handlePickImage}
          disabled={disabled || isProcessing}
          className={`flex-1 flex-row items-center justify-center rounded-2xl py-3 ${
            disabled || isProcessing ? "bg-neutral-lightest" : "bg-primary"
          }`}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color={colors.neutral.white} />
          ) : (
            <Text className="font-nunito-semibold text-body text-neutral-white">
              {value ? "Change Image" : "Choose Image"}
            </Text>
          )}
        </Pressable>

        {value ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Remove banner image"
            accessibilityHint="Clears the selected story banner"
            onPress={handleRemove}
            disabled={disabled || isProcessing}
            className="flex-1 items-center justify-center rounded-2xl border border-neutral-lightest bg-surface py-3"
          >
            <Text className="font-nunito-semibold text-body text-neutral">
              Remove
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
