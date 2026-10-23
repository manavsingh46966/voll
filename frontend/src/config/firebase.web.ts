import { FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import {
  Auth,
  getAuth,
  getIdToken,
  GoogleAuthProvider,
  PhoneAuthProvider,
  UserCredential,
} from "firebase/auth";

/**
 * WEB FIREBASE CONFIGURATION
 * * On Web, we must manually initialize the Firebase App with API keys
 * loaded from environment variables.
 */
const clientCredentials = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

/**
 * Initialize Firebase App (Singleton Pattern).
 * Prevents "Firebase App named '[DEFAULT]' already exists" errors during hot-reload.
 */
const app: FirebaseApp =
  getApps().length > 0 ? getApp() : initializeApp(clientCredentials);

/**
 * The initialized Firebase Auth instance for Web.
 */
export const auth: Auth = getAuth(app);

export { getIdToken };

/**
 * The Google Auth Provider Class for Web.
 * Used to configure OAuth scopes (profile, email).
 */
export const GoogleProvider = GoogleAuthProvider;

/**
 * The Phone Auth Provider Class for Web.
 * Used for verifyPhoneNumber logic.
 */
export const PhoneProvider = PhoneAuthProvider;

/**
 * TYPE EXPORTS (Critical for Parity)
 * We re-export these types so generic hooks can import them
 * from '@/src/config/firebase' without caring about the platform.
 */
export type { Auth, UserCredential };
