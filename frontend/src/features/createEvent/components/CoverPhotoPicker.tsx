import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";

import { MaterialIcons } from "@expo/vector-icons";

import { colors } from "@/constants/theme";

/**
 * Safety threshold (in characters) for the base64-encoded image string.
 * This prevents extremely large image uploads from exceeding database payload or MongoDB limits (~2MB).
 */
const MAX_BASE64_LENGTH = 2_000_000;

/**
 * Properties expected by the {@link CoverPhotoPicker} component.
 */
interface Props {
  /**
   * The image URL or local file path URI of the currently selected cover photo.
   * If not provided or empty, the component displays an "Add Cover Photo" call-to-action.
   */
  coverPhotoUrl: string;
  /**
   * Callback fired when a new image is selected and successfully compressed.
   *
   * @param uri The local URI of the picked image asset.
   * @param base64String The data URL format string containing MIME type and base64-encoded image data.
   */
  onPhotoSelected: (uri: string, base64String: string) => void;
}

/**
 * CoverPhotoPicker is a touchable component that allows users to select and crop a cover photo
 * for an event. It manages requesting camera roll permissions, calling the native image picker,
 * compressing the image, and validating that the output base64 data size is within the allowed
 * MongoDB threshold (~2MB) before passing the results up to the parent component.
 *
 * @param props The props for the component.
 * @param props.coverPhotoUrl The current cover photo URL or path.
 * @param props.onPhotoSelected Callback for when a photo is selected.
 * @returns {React.JSX.Element} A touchable cover photo picker or preview image.
 */
export function CoverPhotoPicker({ coverPhotoUrl, onPhotoSelected }: Props) {
  const [processing, setProcessing] = useState(false);

  /**
   * Prompts the user to select an image from their device's media library,
   * requests necessary permissions, applies standard compression and editing constraints (16:9 aspect ratio),
   * validates size limits, and propagates the result to parent state.
   *
   * Workflow:
   * 1. Requests media library permissions using Expo's {@link ImagePicker.requestMediaLibraryPermissionsAsync}.
   * 2. Launches the image picker using {@link ImagePicker.launchImageLibraryAsync} with crop constraints.
   * 3. Checks if operation was canceled.
   * 4. Encodes and verifies size against {@link MAX_BASE64_LENGTH}.
   * 5. Formats as data URI string and triggers {@link onPhotoSelected}.
   *
   * @returns {Promise<void>} Resolves when the permission is checked and the image is picked/compressed.
   */
  const pickAndCompressImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      return Alert.alert(
        "Permission needed",
        "Please allow access to your photo library.",
      );
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.2,
      base64: true,
    });

    if (result.canceled || !result.assets[0]) return;

    setProcessing(true);
    try {
      const asset = result.assets[0];
      if (!asset.base64) throw new Error("Failed to generate Base64");

      if (asset.base64.length > MAX_BASE64_LENGTH) {
        Alert.alert(
          "Image Too Large",
          "Even after compression, this image is too large. Please choose another.",
        );
        return;
      }

      const mimeType = asset.mimeType || "image/jpeg";
      const base64String = `data:${mimeType};base64,${asset.base64}`;

      onPhotoSelected(asset.uri, base64String);
    } catch (error) {
      Alert.alert(
        "Processing failed",
        "Could not process cover photo. Please try again.",
      );
    } finally {
      setProcessing(false);
    }
  };

  return (
    <TouchableOpacity
      accessibilityRole="button"
      className="h-48 w-full items-center justify-center overflow-hidden bg-neutral-lightest"
      onPress={pickAndCompressImage}
      disabled={processing}
      activeOpacity={0.85}
    >
      {processing ? (
        <View className="items-center gap-y-2">
          <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
          <Text className="font-nunito-semibold text-[14px] text-primary">
            Processing...
          </Text>
        </View>
      ) : coverPhotoUrl ? (
        <>
          <Image
            source={{ uri: coverPhotoUrl }}
            className="h-full w-full"
            contentFit="cover"
          />
          <View className="absolute bottom-2 right-2 flex-row items-center gap-x-1 rounded-full bg-black/60 px-3 py-1">
            <MaterialIcons name="camera-alt" size={14} color="white" />
            <Text className="font-nunito-semibold text-[12px] text-white">
              Change Photo
            </Text>
          </View>
        </>
      ) : (
        <View className="items-center gap-y-2">
          <MaterialIcons
            name="camera-alt"
            size={32}
            color={colors.neutral.light}
          />
          <Text className="font-nunito text-[14px] text-neutral-light">
            Add Cover Photo
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
