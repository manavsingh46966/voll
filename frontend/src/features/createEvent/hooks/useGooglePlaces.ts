import { useEffect, useRef, useState } from "react";
import * as Location from "expo-location";

import { EventLocation } from "../types/event.types";

/**
 * Autocomplete prediction structure returned by Google Places API v1 autocomplete endpoint.
 */
interface PlacePrediction {
  /** The unique Google Place ID. */
  placeId: string;
  /** Structured text formats for UI display (mainText and secondaryText). */
  structuredFormat?: {
    mainText?: { text?: string };
    secondaryText?: { text?: string };
  };
}

/**
 * Structure mapping to the Google Places API v1 Place Details endpoint response.
 */
interface PlaceDetailsResponse {
  /** Display/business name object. */
  displayName?: { text?: string };
  /** Complete formatted postal address. */
  formattedAddress?: string;
  /** Geographic coordinate object. */
  location?: { latitude?: number; longitude?: number };
}

/**
 * Generates a session token for grouping Google Places API queries into a single billing session.
 * Utilizes current timestamp and a random alphanumeric string.
 *
 * @returns {string} A unique session token string.
 */
const generateSessionToken = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

/**
 * Derives a city name from an Expo reverse geocoded address.
 * Falls back to subregion or region if city is undefined.
 *
 * @param {Location.LocationGeocodedAddress} [address] - Geocoded address components from Expo.
 * @returns {string} The resolved city name, or an empty string.
 */
function getCityFromAddress(address?: Location.LocationGeocodedAddress) {
  return address?.city || address?.subregion || address?.region || "";
}

/**
 * Custom React hook for searching, selecting, and acquiring locations using the Google Places API
 * and device GPS hardware.
 *
 * Features automated debouncing for autocomplete search input, Places details retrieval, and reverse geocoding
 * for "use current location" GPS selection.
 *
 * @param {boolean} visible - Controls active searching state (resets query search terms when modal closes).
 * @param {Function} onSelectLocation - Callback invoked when a location is successfully selected.
 * @param {EventLocation} onSelectLocation.location - The selected EventLocation details.
 * @returns {object} Hook state and control methods:
 * * `query` {string} - Active search text input.
 * * `setQuery` {Function} - Updates query text.
 * * `results` {PlacePrediction[]} - Autocomplete suggestion list.
 * * `loading` {boolean} - True when fetching API details or querying coordinates.
 * * `error` {string|null} - Fetching or permission errors.
 * * `handleSelect` {Function} - Function to select autocomplete option and retrieve GPS coordinates.
 * * `handleCurrentLocation` {Function} - Requests GPS permissions and performs reverse geocoding on current coordinates.
 */
export function useGooglePlaces(
  visible: boolean,
  onSelectLocation: (location: EventLocation) => void,
) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlacePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionToken = useRef(generateSessionToken());

  // 🚨 FIX: Read the API key inside the hook to prevent the "configurable" error!
  const apiKey = process.env.EXPO_PUBLIC_MAPS_API_KEY ?? "";

  // Reset state when modal closes
  useEffect(() => {
    if (!visible) {
      setQuery("");
      setResults([]);
      setError(null);
      sessionToken.current = generateSessionToken();
    }
  }, [visible]);

  // Debounced Search Effect
  useEffect(() => {
    if (!visible) return;
    const handle = setTimeout(async () => {
      const trimmed = query.trim();
      if (!trimmed) return setResults([]);
      if (!apiKey) return setError("Google Maps key is missing.");

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          "https://places.googleapis.com/v1/places:autocomplete",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Goog-Api-Key": apiKey,
              "X-Goog-FieldMask":
                "suggestions.placePrediction.placeId,suggestions.placePrediction.structuredFormat",
            },
            body: JSON.stringify({
              input: trimmed,
              sessionToken: sessionToken.current,
            }),
          },
        );

        const data = await response.json();
        setResults(
          Array.isArray(data.suggestions)
            ? data.suggestions
                .map((i: any) => i.placePrediction)
                .filter(Boolean)
            : [],
        );
      } catch {
        setError("Could not search places. Please try again.");
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(handle);
  }, [query, visible, apiKey]);

  /**
   * Fetches full coordinate data for a chosen autocomplete item and triggers onSelectLocation.
   *
   * @param {PlacePrediction} place - The place recommendation card chosen by the user.
   */
  const handleSelect = async (place: PlacePrediction) => {
    if (!apiKey) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://places.googleapis.com/v1/places/${place.placeId}?sessionToken=${sessionToken.current}`,
        {
          headers: {
            "X-Goog-Api-Key": apiKey,
            "X-Goog-FieldMask": "id,displayName,formattedAddress,location",
          },
        },
      );
      const data = (await response.json()) as PlaceDetailsResponse;
      if (
        typeof data.location?.latitude !== "number" ||
        typeof data.location?.longitude !== "number"
      ) {
        throw new Error("Missing coordinates");
      }

      onSelectLocation({
        latitude: data.location.latitude,
        longitude: data.location.longitude,
        address: data.formattedAddress,
        name: data.displayName?.text,
        placeId: place.placeId,
      });
    } catch {
      setError("Could not load this place.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Requests location permissions, queries GPS coordinates, and triggers reverse geocoding lookup.
   *
   * @returns {Promise<void>} Resolves when the permission is checked and current location is updated.
   */
  const handleCurrentLocation = async () => {
    setLoading(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted")
        return setError("Location permission was not granted.");

      const current = await Location.getCurrentPositionAsync({});
      const [address] = await Location.reverseGeocodeAsync({
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      });

      const addressText = address
        ? [
            address.name,
            address.street,
            address.city,
            address.region,
            address.country,
          ]
            .filter(Boolean)
            .join(", ")
        : "Current Location";

      onSelectLocation({
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
        name:
          address?.name || getCityFromAddress(address) || "Current Location",
        address: addressText,
      });
    } catch {
      setError("Could not get your current location.");
    } finally {
      setLoading(false);
    }
  };

  return {
    query,
    setQuery,
    results,
    loading,
    error,
    handleSelect,
    handleCurrentLocation,
  };
}
