import React from "react";
import { ActivityIndicator, Modal, Text, View } from "react-native";

import { colors } from "@/constants/theme";

interface LoadingModalProps {
  visible: boolean;
  message?: string;
}

/**
 * **Global Loading Overlay**
 *
 * A blocking modal component used during critical asynchronous operations (e.g., API calls, Uploads).
 * It prevents user interaction with the underlying UI while displaying a spinner and status message.
 *
 * **Key Features:**
 * - **Blocking UI:** Uses a transparent but touch-blocking modal to prevent accidental clicks.
 * - **Visual Focus:** Dims the background (black/40) to highlight the loading status.
 * - **Customizable:** Accepts a dynamic message prop to inform the user of the specific action.
 *
 * @component
 * @example
 * <LoadingModal visible={isUploading} message="Uploading Story..." />
 *
 * @param {LoadingModalProps} props - The configuration props.
 * @returns {JSX.Element} The rendered Loading Modal.
 */
export const LoadingModal = ({
  visible,
  message = "Please wait...",
}: LoadingModalProps) => {
  return (
    <Modal transparent visible={visible} animationType="fade">
      {/* Darkened Background */}
      <View className="flex-1 items-center justify-center bg-black/40">
        {/* White Card */}
        <View className="min-w-[150px] items-center rounded-2xl bg-surface p-6 shadow-lg">
          <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
          <Text className="mt-4 text-center text-base font-bold">
            {message}
          </Text>
        </View>
      </View>
    </Modal>
  );
};
