// src/theme/theme.js (or whatever your path is)

export const colors = {
  // --- BRAND COLORS ---
  primary: {
    DEFAULT: "#01A39F", // Main Turquoise
    pressed: "#01726F", // Darker Teal
    disabled: "#80D1CF", // Lighter Teal
    surface: "#E1F2F2", // Very light teal
  },

  // --- NEUTRALS ---
  neutral: {
    DEFAULT: "#1C1C1E", // Default text color
    dark: "#48484A", // Dark Gray
    gray: "#636366", // Gray
    light: "#8E8E93", // Light Gray
    lightest: "#E5E5EA", // Text/Lightest Gray
    white: "#FFFFFF",
  },

  // --- BACKGROUND SURFACES ---
  surface: {
    DEFAULT: "#FFFFFF",
    gray: "#F2F2F5",
    yellow: "#F4AF06",
  },

  // --- FEEDBACK ---
  error: "#EF4444",
  success: "#10B981",
};

// Exporting your fonts here too, just in case you ever need to use
// them in a native StyleSheet or Navigation Header!
export const fonts = {
  regular: "Nunito-Regular",
  semibold: "Nunito-SemiBold",
  bold: "Nunito-Bold",
};
