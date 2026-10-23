import React from "react";
import { Text, TextInput, View } from "react-native";

interface JoinNotesSectionProps {
  /** Current notes text. */
  notes: string;
  /** Callback when notes text changes. */
  onChangeNotes: (text: string) => void;
}

/**
 * Renders the "Additional Notes" section for the join event page.
 * A text input for the volunteer to add a personal note.
 *
 * @param root0 - Component props.
 * @param root0.notes - Current notes value.
 * @param root0.onChangeNotes - Change handler.
 * @returns {JSX.Element} The rendered notes section.
 */
export function JoinNotesSection({
  notes,
  onChangeNotes,
}: JoinNotesSectionProps): React.JSX.Element {
  return (
    <View className="mt-4 p-4">
      <Text className="font-nunito-bold text-lg text-neutral-black">
        Additional Notes
      </Text>
      <TextInput
        className="my-3 mt-2 h-12 rounded-md border border-neutral-lightest p-2 font-nunito text-sm text-neutral-dark"
        placeholder="Type here..."
        placeholderTextColor="#8E8E93"
        multiline
        value={notes}
        onChangeText={onChangeNotes}
      />
    </View>
  );
}
