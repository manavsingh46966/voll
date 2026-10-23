import { ConfigContext, ExpoConfig } from "expo/config";

// ----------------------------------------------------------------------
// 1. ENVIRONMENT LOGIC
// ----------------------------------------------------------------------
const IS_DEV = process.env.APP_VARIANT === "development";
const IS_PREVIEW = process.env.APP_VARIANT === "preview";

const getUniqueIdentifier = () => {
  if (IS_DEV) return "com.volstory.reactnative.dev";
  if (IS_PREVIEW) return "com.volstory.reactnative.preview";
  return "com.volstory.reactnative";
};

const getAppName = () => {
  if (IS_DEV) return "VolStory (Dev)";
  if (IS_PREVIEW) return "VolStory (Pre)";
  return "VolStory";
};

/**
 * Generates the dynamic Expo configuration based on the environment.
 * This function handles app variants (Dev/Preview/Prod), API keys, and native plugin setup.
 *
 * @param {ConfigContext} context - The base context provided by Expo CLI, including the default config from app.json (if any).
 * @param {object} context.config - The partial configuration object.
 * @returns {ExpoConfig} The complete, resolved Expo configuration object used to build the app.
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: getAppName(),
  slug: "volstory",
  version: "1.0.0",
  orientation: "portrait",

  // --------------------------------------------------------------------
  // 2. UI & THEMING
  // --------------------------------------------------------------------
  icon: "./assets/images/logo.png",
  scheme: "volstory",
  userInterfaceStyle: "automatic",
  newArchEnabled: true, // SDK 54+

  splash: {
    image: "./assets/images/splash.png",
    resizeMode: "contain",
    backgroundColor: "#01A39F",
  },

  // --------------------------------------------------------------------
  // 3. IOS CONFIGURATION
  // --------------------------------------------------------------------
  ios: {
    supportsTablet: true,
    bundleIdentifier: getUniqueIdentifier(),
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        "VolStory needs access to your location to show nearby events.",
      NSLocationAlwaysUsageDescription:
        "VolStory needs access to your location even when the app is in the background.",
    },
    config: {
      googleMapsApiKey: process.env.EXPO_PUBLIC_MAPS_API_KEY,
    },
  },

  // --------------------------------------------------------------------
  // 4. ANDROID CONFIGURATION
  // --------------------------------------------------------------------
  android: {
    package: getUniqueIdentifier(),
    googleServicesFile: "./google-services.json",
    adaptiveIcon: {
      foregroundImage: "./assets/images/logo.png",
      backgroundColor: "#ffffff",
    },
    permissions: ["ACCESS_COARSE_LOCATION", "ACCESS_FINE_LOCATION", "INTERNET"],
    config: {
      googleMaps: {
        apiKey: process.env.EXPO_PUBLIC_MAPS_API_KEY,
      },
    },
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [
          { scheme: "https", host: "volstory.app", pathPrefix: "/records" },
        ],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
  },

  // --------------------------------------------------------------------
  // 5. WEB CONFIGURATION
  // --------------------------------------------------------------------
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/logo.png",
  },

  // --------------------------------------------------------------------
  // 6. PLUGINS (Strict Configuration)
  // --------------------------------------------------------------------
  plugins: [
    "expo-router",
    "expo-localization",

    // Google Sign In (Native)
    "@react-native-google-signin/google-signin",

    // Firebase App (Native Core)
    "@react-native-firebase/app",

    // Firebase Auth (Native Auth)
    "@react-native-firebase/auth",

    // Build Properties (Essential for Native Firebase Compatibility on iOS)
    [
      "expo-build-properties",
      {
        ios: {
          useFrameworks: "static", // REQUIRED for Firebase on iOS
        },
        android: {
          // Standard modern compileSdkVersion
          compileSdkVersion: 35,
          targetSdkVersion: 34,
          buildToolsVersion: "35.0.0",
        },
      },
    ],

    // Location Services
    [
      "expo-location",
      {
        locationAlwaysAndWhenInUsePermission:
          "Allow VolStory to use your location for showing nearby events.",
        locationWhenInUsePermission:
          "Allow VolStory to access your location while the app is running.",
      },
    ],
  ],

  experiments: {
    typedRoutes: true,
  },

  updates: {
    url: "https://u.expo.dev/7c5dcc04-c0d0-4351-9280-42791fb6d7f1",
  },
  runtimeVersion: {
    policy: "appVersion",
  },

  extra: {
    router: {
      origin: false,
    },
    eas: {
      projectId: "7c5dcc04-c0d0-4351-9280-42791fb6d7f1",
    },
    apiUrl: process.env.EXPO_PUBLIC_API_URL,
    mapsApiKey: process.env.EXPO_PUBLIC_MAPS_API_KEY,
  },
});
