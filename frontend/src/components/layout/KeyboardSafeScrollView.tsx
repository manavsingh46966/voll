import React from "react";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
  children: React.ReactNode;
  contentContainerStyle?: any;
}

/**
 * A global wrapper for all modal and form screens.
 * Uses KeyboardAwareScrollView to automatically track the user's cursor
 * and scroll the screen up so inputs are never hidden.
 * @param root0
 * @param root0.children
 * @param root0.contentContainerStyle
 */
export function KeyboardSafeScrollView({
  children,
  contentContainerStyle,
  ...props
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAwareScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[
        {
          paddingTop: Math.max(insets.top),
          paddingBottom: Math.max(insets.bottom),
          flexGrow: 1,
        },
        contentContainerStyle,
      ]}
      enableOnAndroid={true}
      enableAutomaticScroll={true}
      keyboardShouldPersistTaps="handled"
      {...props}
    >
      {children}
    </KeyboardAwareScrollView>
  );
}
