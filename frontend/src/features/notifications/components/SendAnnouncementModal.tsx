import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import { colors } from "@/constants/theme";
import { showAlert } from "@/src/utils/alert";

import { useBroadcastAnnouncement } from "../hooks/useNotifications";

interface SendAnnouncementModalProps {
  visible: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
}

export const SendAnnouncementModal: React.FC<SendAnnouncementModalProps> = ({
  visible,
  onClose,
  eventId,
  eventTitle,
}) => {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  const { mutate: broadcast, isPending } = useBroadcastAnnouncement();

  const handleSend = () => {
    if (!message.trim()) {
      showAlert("Message Required", "Please enter an announcement message.");
      return;
    }

    broadcast(
      {
        eventId,
        title: title.trim() || `Update: ${eventTitle}`,
        message: message.trim(),
      },
      {
        onSuccess: (data) => {
          showAlert(
            "Announcement Sent!",
            `Successfully notified ${data.notifiedCount} joined volunteer(s).`,
          );
          setTitle("");
          setMessage("");
          onClose();
        },
        onError: () => {
          showAlert("Error", "Failed to send announcement. Please try again.");
        },
      },
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 items-center justify-center bg-black/50 px-6">
        <View className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
          {/* Header */}
          <View className="mb-4 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="mr-2.5 h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
                <Ionicons name="megaphone" size={20} color="#D97706" />
              </View>
              <View>
                <Text className="font-nunito-bold text-lg text-neutral-black">
                  Send Announcement
                </Text>
                <Text
                  className="text-xs text-neutral-gray"
                  numberOfLines={1}
                >
                  To all volunteers of {eventTitle}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={onClose}
              className="p-1"
            >
              <Ionicons name="close" size={22} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Title Input */}
          <Text className="mb-1.5 font-nunito-bold text-xs uppercase tracking-wider text-neutral-dark">
            Title (Optional)
          </Text>
          <TextInput
            accessibilityLabel="Announcement Title"
            placeholder="e.g. Schedule Change / Important Update"
            value={title}
            onChangeText={setTitle}
            className="mb-4 h-12 rounded-xl border border-neutral-light px-4 text-sm text-neutral-black focus:border-primary"
            placeholderTextColor="#9CA3AF"
          />

          {/* Message Input */}
          <Text className="mb-1.5 font-nunito-bold text-xs uppercase tracking-wider text-neutral-dark">
            Message
          </Text>
          <TextInput
            accessibilityLabel="Announcement Message"
            placeholder="Write your update or instruction for volunteers..."
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            className="mb-6 h-28 rounded-xl border border-neutral-light p-4 text-sm text-neutral-black focus:border-primary"
            placeholderTextColor="#9CA3AF"
          />

          {/* Actions */}
          <View className="flex-row items-center space-x-3">
            <TouchableOpacity
              accessibilityRole="button"
              onPress={onClose}
              disabled={isPending}
              className="flex-1 rounded-xl bg-gray-100 py-3.5 active:bg-gray-200"
            >
              <Text className="text-center font-nunito-bold text-sm text-neutral-dark">
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              accessibilityRole="button"
              onPress={handleSend}
              disabled={isPending || !message.trim()}
              className={`flex-1 rounded-xl py-3.5 ${
                isPending || !message.trim() ? "bg-primary/50" : "bg-primary"
              }`}
            >
              {isPending ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text className="text-center font-nunito-bold text-sm text-white">
                  Broadcast
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
