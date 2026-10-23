/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // --- BRAND COLORS ---
        primary: {
          DEFAULT: "#01A39F", // Main Turquoise
          pressed: "#01726F", // Darker Teal for pressed state
          disabled: "#80D1CF", // Lighter Teal for disabled state
          surface: "#E1F2F2", // Very light teal (Used in Secondary Pressed)
        },
        
        // --- NEUTRALS ---
        neutral: {
          black: "#1C1C1E",
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
        },
        
        // --- FEEDBACK (Standard assumptions, update if you have specific hexes) ---
        error: "#EF4444",
        success: "#10B981",
      },
      
      // --- TYPOGRAPHY ---
      fontFamily: {
        nunito: ["Nunito-Regular"],
        "nunito-semibold": ["Nunito-SemiBold"],
        "nunito-bold": ["Nunito-Bold"],
      },
      fontSize: {
        heading: ["24px", { lineHeight: "28.8px" }], // 120%
        big:     ["16px", { lineHeight: "19.2px" }], // 120%
        body:    ["15px", { lineHeight: "21px" }],   // 140%
        small:   ["12px", { lineHeight: "14.4px" }], // 120%
        caption: ["12px", { lineHeight: "16.8px" }], // 140%
      },
      
      // --- SPACING ---
      spacing: {
        '4.5': '18px', // Custom spacer from guide on figma
        '13': '52px',  // For large category icons
      }
    },
  },
  plugins: [],
};
