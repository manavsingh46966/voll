import { Alert, Platform } from "react-native";

/**
 * Displays a platform-agnostic alert dialog.
 * * On **Web**: Uses the native browser `window.alert()`.
 * On **Mobile**: Uses the React Native `Alert.alert()` modal.
 * * @param title - The bold header text of the alert.
 * @param title
 * @param message - The descriptive body text of the alert.
 * * @example
 * showAlert("Error", "Network connection failed");
 */
export const showAlert = (title: string, message: string): void => {
  if (Platform.OS === "web") {
    // Web implementation: Simple browser alert
    window.alert(`${title}\n\n${message}`);
  } else {
    // Mobile implementation: Native Modal
    Alert.alert(title, message);
  }
};
