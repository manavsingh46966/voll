import React from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";

/**
 * Props for the ActionModal component.
 */
interface ActionModalProps {
  /** Controls the visibility of the modal */
  visible: boolean;
  /** The bold header text displayed at the top */
  title: string;
  /** The descriptive body text */
  message: string;
  /** Label for the primary (positive) action button (e.g., "Confirm", "Login") */
  actionLabel: string;
  /** Callback function triggered when the primary button is pressed */
  onAction: () => void;
  /** Optional: Label for the secondary (negative/cancel) action button */
  secondaryLabel?: string;
  /** Optional: Callback function triggered when the secondary button is pressed */
  onSecondary?: () => void;
}

/**
 * **Action Modal Component**
 *
 * A reusable, blocking UI element used for critical user decisions or alerts.
 * It overlays the current screen with a dimmed background and presents a centered dialog box.
 *
 * **Key Features:**
 * - **Focus:** Dimmed background (backdrop) ensures user attention is on the modal.
 * - **Flexibility:** Supports both single-action (Alert) and dual-action (Confirmation) modes.
 * - **System Integration:** Handles Android Status Bar translucency and hardware back button requests.
 *
 * @component
 * @example
 * <ActionModal
 * visible={showModal}
 * title="Delete Account"
 * message="Are you sure? This cannot be undone."
 * actionLabel="Delete"
 * onAction={handleDelete}
 * secondaryLabel="Cancel"
 * onSecondary={() => setShowModal(false)}
 * />
 *
 * @param {ActionModalProps} props - The configuration props for the modal.
 * @returns {JSX.Element} The rendered Modal component.
 */
export const ActionModal = ({
  visible,
  title,
  message,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
}: ActionModalProps) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent // Ensures it covers status bar on Android
      onRequestClose={onSecondary} // Hardware back button support
    >
      <View className="flex-1 items-center justify-center bg-black/60 px-6">
        <View className="w-full max-w-sm rounded-2xl bg-surface p-6 shadow-xl">
          <Text className="mb-3 text-center text-xl font-bold text-neutral">
            {title}
          </Text>

          <Text className="mb-8 text-center text-base leading-6 text-neutral-gray">
            {message}
          </Text>

          {/* Primary Action */}
          <TouchableOpacity
            accessibilityRole="button"
            onPress={onAction}
            activeOpacity={0.8}
            className="mb-3 h-12 w-full items-center justify-center rounded-xl bg-primary"
          >
            <Text className="text-base font-bold text-neutral-white">
              {actionLabel}
            </Text>
          </TouchableOpacity>

          {/* Secondary Action */}
          {secondaryLabel && onSecondary && (
            <TouchableOpacity
              accessibilityRole="button"
              onPress={onSecondary}
              activeOpacity={0.6}
              className="h-12 w-full items-center justify-center rounded-xl"
            >
              <Text className="text-base font-bold text-primary">
                {secondaryLabel}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};
