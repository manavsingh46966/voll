import React from "react";
import { ActivityIndicator, Modal, Pressable, Text, View } from "react-native";

import { colors } from "@/constants/theme";

interface Props {
  visible: boolean;
  title?: string;
  message?: string;
  isLoading?: boolean;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

/**
 * Renders a confirmation modal for destructive story deletion.
 *
 * @param root0 - Delete confirmation modal props.
 * @param root0.visible - Whether the modal is visible.
 * @param root0.title - Modal title.
 * @param root0.message - Modal body copy.
 * @param root0.isLoading - Whether deletion is in progress.
 * @param root0.onConfirm - Callback to confirm deletion.
 * @param root0.onCancel - Callback to cancel deletion.
 * @returns The delete confirmation modal.
 */
export default function DeleteConfirmModal({
  visible,
  title = "Delete Story",
  message = "This action cannot be undone. Are you sure you want to delete this story?",
  isLoading = false,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 items-center justify-center bg-black/40">
        <View className="mx-6 w-full rounded-2xl bg-surface p-6 shadow-lg">
          <Text className="font-nunito-bold text-big text-neutral">
            {title}
          </Text>
          <Text className="mt-3 text-body text-neutral-gray">{message}</Text>

          <View className="mt-6 flex-row gap-3">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cancel delete"
              accessibilityHint="Closes the delete confirmation"
              style={{ zIndex: 99999, elevation: 99999 }}
              onPress={onCancel}
              disabled={isLoading}
              className="flex-1 rounded-2xl border border-neutral-lightest bg-surface py-3"
            >
              <Text className="text-center font-nunito-semibold text-body text-neutral">
                Cancel
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Confirm delete"
              accessibilityHint="Permanently deletes this story"
              onPress={onConfirm}
              disabled={isLoading}
              className="flex-1 flex-row items-center justify-center rounded-2xl bg-error py-3"
            >
              {isLoading ? (
                <ActivityIndicator color={colors.neutral.white} size="small" />
              ) : (
                <Text className="text-center font-nunito-semibold text-body text-neutral-white">
                  Delete
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
