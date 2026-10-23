import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";

import { BottomSheetTextInput } from "@gorhom/bottom-sheet";

import { colors, fonts } from "@/constants/theme";
import { useSessionStore } from "@/src/stores/session.store";

import { EmojiQuickReactions } from "./EmojiQuickReactions";

const InputFallback =
  Platform.OS === "web" ? (TextInput as any) : BottomSheetTextInput;

interface CommentInputBarProps {
  onSubmit: (content: string) => Promise<void>;
  replyingToUser?: string | null;
  onCancelReply?: () => void;
}

const styles = StyleSheet.create({
  input: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.neutral.DEFAULT,
    minHeight: 40,
    paddingTop: 8,
    paddingBottom: 8,
    textAlignVertical: "center",
  },
});

/**
 * Renders the comment composer used inside the story comments sheet.
 *
 * @param root0 - Comment input props.
 * @param root0.onSubmit - Callback that sends the comment content.
 * @param root0.replyingToUser - Optional username being replied to.
 * @param root0.onCancelReply - Optional callback to cancel reply mode.
 * @returns The comment input bar.
 */
export const CommentInputBar: React.FC<CommentInputBarProps> = ({
  onSubmit,
  replyingToUser,
  onCancelReply,
}) => {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<React.ElementRef<typeof BottomSheetTextInput>>(null);
  const { user } = useSessionStore();
  const insets = useSafeAreaInsets();
  const containerStyle = useMemo(
    () => ({ paddingBottom: Math.max(insets.bottom, 8) }),
    [insets.bottom],
  );

  useEffect(() => {
    if (replyingToUser) {
      inputRef.current?.focus();
    }
  }, [replyingToUser]);

  const handleSubmit = async () => {
    const normalized = content.trim();
    if (!normalized || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSubmit(normalized);
      setContent("");
      Keyboard.dismiss();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setContent((prev) => `${prev}${emoji}`);
  };

  const userInitial =
    user?.name?.trim()?.charAt(0)?.toUpperCase() ||
    user?.email?.trim()?.charAt(0)?.toUpperCase() ||
    "U";

  return (
    <View
      className="border-t border-surface-gray bg-surface"
      style={containerStyle}
    >
      {user && <EmojiQuickReactions onEmojiSelect={handleEmojiSelect} />}

      {replyingToUser && (
        <View className="flex-row items-center justify-between bg-surface-gray px-4 py-2">
          <Text className="text-small text-neutral-gray">
            Replying to{" "}
            <Text className="font-nunito-semibold text-neutral">
              {replyingToUser}
            </Text>
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancel reply"
            accessibilityHint="Stops replying to the selected comment"
            onPress={onCancelReply}
            className="p-1"
          >
            <Text className="font-nunito-semibold text-small text-primary">
              Cancel
            </Text>
          </Pressable>
        </View>
      )}

      <View className="flex-row items-center gap-3 px-4 py-3">
        {!user ? (
          <View className="flex-1 flex-row items-center justify-center py-2">
            <Text className="font-nunito text-[15px] text-neutral-light">
              Log in to join the conversation.
            </Text>
          </View>
        ) : (
          <>
            {user.profileImageUrl ? (
              <Image
                source={{ uri: user.profileImageUrl }}
                className="h-10 w-10 rounded-full bg-surface-gray"
                contentFit="cover"
              />
            ) : (
              <View className="h-10 w-10 items-center justify-center rounded-full bg-surface-gray">
                <Text className="font-nunito-bold text-neutral-gray">
                  {userInitial}
                </Text>
              </View>
            )}

            <View className="flex-1 rounded-3xl border border-surface-gray px-4 py-2">
              <InputFallback
                ref={inputRef}
                style={styles.input}
                placeholder="Add your comment"
                placeholderTextColor={colors.neutral.light}
                value={content}
                onChangeText={setContent}
                multiline
                maxLength={500}
                editable={!isSubmitting}
              />
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Post comment"
              accessibilityHint="Submits your comment"
              onPress={handleSubmit}
              disabled={!content.trim() || isSubmitting}
              className={`px-2 ${!content.trim() || isSubmitting ? "opacity-50" : ""}`}
            >
              <Text className="font-nunito-semibold text-body text-primary">
                Add
              </Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
};
