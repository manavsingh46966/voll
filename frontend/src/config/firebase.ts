import { getApp } from "@react-native-firebase/app";
import type { FirebaseAuthTypes } from "@react-native-firebase/auth";
import {
  getAuth,
  getIdToken,
  GoogleAuthProvider,
  PhoneAuthProvider,
} from "@react-native-firebase/auth";

/**
 * NATIVE CONFIGURATION (Modular V20 Standard)
 * Connects to the native iOS/Android SDKs.
 */

// 1. Get the Default App Instance
// On Native, the app is initialized automatically by the native build
// (via google-services.json), so we can just retrieve it.
const app = getApp();

// 2. Export the Auth Instance
export const auth = getAuth(app);

export { getIdToken };

// 3. Export Providers
export const PhoneProvider = PhoneAuthProvider;
export const GoogleProvider = GoogleAuthProvider;

// 4. Export Type Aliases (CRITICAL FOR WEB PARITY)
// These allow generic hooks to import types from '@/src/config/firebase'
// without caring about the underlying platform SDK.
export type Auth = FirebaseAuthTypes.Module;
export type UserCredential = FirebaseAuthTypes.UserCredential;
