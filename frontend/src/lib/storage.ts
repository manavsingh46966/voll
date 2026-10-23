import { createMMKV } from "react-native-mmkv";

// Initialize the MMKV instance (Native C++ storage)
const storage = createMMKV({
  id: "volstory-storage",
});

/**
 * A wrapper around MMKV for high-performance synchronous storage.
 * Handles Native persistence (iOS/Android).
 */
export const clientStorage = {
  /**
   * Saves a value to on-device storage.
   * @param key - The unique key identifier.
   * @param value - The value to store (String, Number, or Boolean).
   */
  setItem: (key: string, value: string | number | boolean): void => {
    storage.set(key, value);
  },

  /**
   * Retrieves a string value from storage.
   * @param key - The unique key identifier.
   * @returns The stored string or `null` if missing (Matches Web API).
   */
  getItem: (key: string): string | null => {
    const value = storage.getString(key);
    return value ?? null; // ✅ FIX: Normalize 'undefined' to 'null' to match Web LocalStorage
  },

  /**
   * Removes a specific item from storage.
   * @param key - The unique key identifier.
   */
  removeItem: (key: string): void => {
    storage.remove(key);
  },

  /**
   * Wipes all data from the storage instance.
   * Use carefully (e.g., during 'Delete Account').
   */
  clearAll: (): void => {
    storage.clearAll();
  },
};
