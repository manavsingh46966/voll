/**
 * A wrapper around LocalStorage for Web persistence.
 * This is the "Web Polyfill" for the MMKV adapter.
 */
export const clientStorage = {
  /**
   * Saves a value to browser LocalStorage.
   * @param key - The unique key identifier.
   * @param value - The value to store.
   */
  setItem: (key: string, value: string | number | boolean): void => {
    if (typeof window !== "undefined") {
      localStorage.setItem(key, String(value));
    }
  },

  /**
   * Retrieves a value from LocalStorage.
   * @param key - The unique key identifier.
   * @returns The stored string or `null` if missing.
   */
  getItem: (key: string): string | null => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(key);
    }
    return null;
  },

  /**
   * Removes a specific key from LocalStorage.
   * @param key
   */
  removeItem: (key: string): void => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(key);
    }
  },

  /**
   * Wipes all LocalStorage data.
   */
  clearAll: (): void => {
    if (typeof window !== "undefined") {
      localStorage.clear();
    }
  },
};
