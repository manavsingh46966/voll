import React from "react";
import { Pressable, Text, View } from "react-native";

interface EmojiQuickReactionsProps {
  onEmojiSelect: (emoji: string) => void;
}

const EMOJIS = ["👍", "😍", "🙌", "🎉", "⭐", "✅"];

/**
 * Renders quick emoji shortcuts above the comment input.
 *
 * @param root0 - Emoji quick reaction props.
 * @param root0.onEmojiSelect - Callback fired when an emoji is selected.
 * @returns A row of emoji reaction buttons.
 */
export const EmojiQuickReactions: React.FC<EmojiQuickReactionsProps> = ({
  onEmojiSelect,
}) => {
  return (
    <View className="flex-row items-center justify-around border-t border-surface-gray bg-surface py-3">
      {EMOJIS.map((emoji, index) => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Add ${emoji} reaction`}
          accessibilityHint="Adds this emoji to your comment"
          key={index}
          onPress={() => onEmojiSelect(emoji)}
          className="p-2 active:opacity-70"
        >
          <Text className="text-2xl">{emoji}</Text>
        </Pressable>
      ))}
    </View>
  );
};
