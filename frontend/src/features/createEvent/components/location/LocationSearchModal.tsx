/* eslint-disable max-lines */
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Constants from "expo-constants";
import * as Location from "expo-location";

import { Ionicons } from "@expo/vector-icons";

import { colors } from "@/constants/theme";

import type { EventLocation } from "../../types/event.types";

const GOOGLE_MAPS_KEY: string = Constants.expoConfig?.extra?.mapsApiKey ?? "";

/**
 * Repesents a place recommendation object returned from the Google Places Autocomplete API.
 */
interface PlacePrediction {
  /** The Google place ID string used to retrieve details later. */
  placeId: string;
  /** Custom structured components holding primary title and secondary subtitle text description. */
  structuredFormat?: {
    /** The main header text of the place. */
    mainText?: { text?: string };
    /** The secondary descriptive/sub-address text of the place. */
    secondaryText?: { text?: string };
  };
}

/**
 * Encapsulates a recommendation suggestion returned from Google Autocomplete.
 */
interface AutocompleteSuggestion {
  /** The detailed place prediction object. */
  placePrediction?: PlacePrediction;
}

/**
 * Format structure returned by the Google Places autocomplete fetch endpoint.
 */
interface AutocompleteResponse {
  /** Array of autocomplete suggestions matching user search query. */
  suggestions?: AutocompleteSuggestion[];
}

/**
 * Result details returned from Google Places Details API query.
 */
interface PlaceDetailsResponse {
  /** The name or title displayed for the location. */
  displayName?: { text?: string };
  /** The complete, human-readable address format. */
  formattedAddress?: string;
  /** Geographic coordinate coordinates containing latitude and longitude. */
  location?: {
    /** Target latitude coordinate value. */
    latitude?: number;
    /** Target longitude coordinate value. */
    longitude?: number;
  };
}

/**
 * Properties expected by the {@link LocationSearchModal} component.
 */
interface Props {
  /** Boolean control specifying whether the modal is visible. */
  visible: boolean;
  /** Callback fired when the user chooses to dismiss or close the search screen. */
  onClose: () => void;
  /**
   * Callback fired when a place is successfully selected and geocoded.
   *
   * @param location The resolved coordinate and address details structure.
   */
  onSelectLocation: (location: EventLocation) => void;
}

/**
 * Generates a session token string to group autocomplete request transactions.
 * Used for session-based billing compliance with the Google Places API.
 *
 * @returns {string} A unique, randomized session token.
 */
const generateSessionToken = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

/**
 * Extracts a city name from the geocoded address object.
 * Checks for city, subregion, or region properties respectively.
 *
 * @param {Location.LocationGeocodedAddress} [address] The address structure returned by geocoder.
 * @returns {string} The resolved city name, or an empty string.
 */
function getCityFromAddress(address?: Location.LocationGeocodedAddress) {
  return address?.city || address?.subregion || address?.region || "";
}

/**
 * LocationSearchModal is a full-screen search dialog wrapper.
 * It provides a search text input with built-in debounced autocomplete querying
 * against the Google Places Autocomplete API.
 * It also supports requesting foreground GPS permissions to quickly retrieve and reverse-geocode
 * the user's current coordinates.
 *
 * @param props The props for the component.
 * @param props.visible Control modal rendering status.
 * @param props.onClose Modal dismiss handler.
 * @param props.onSelectLocation Callback propagating chosen address object.
 * @returns {React.JSX.Element} The slide-in location search modal.
 */
export function LocationSearchModal({
  visible,
  onClose,
  onSelectLocation,
}: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlacePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionToken = useRef(generateSessionToken());

  useEffect(() => {
    if (!visible) {
      setQuery("");
      setResults([]);
      setError(null);
      sessionToken.current = generateSessionToken();
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) return;

    const handle = setTimeout(async () => {
      const trimmed = query.trim();
      if (!trimmed) {
        setResults([]);
        return;
      }

      if (!GOOGLE_MAPS_KEY) {
        setError("Google Maps key is missing.");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          "https://places.googleapis.com/v1/places:autocomplete",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Goog-Api-Key": GOOGLE_MAPS_KEY,
              "X-Goog-FieldMask":
                "suggestions.placePrediction.placeId,suggestions.placePrediction.structuredFormat",
            },
            body: JSON.stringify({
              input: trimmed,
              sessionToken: sessionToken.current,
            }),
          },
        );

        const data = (await response.json()) as AutocompleteResponse;
        setResults(
          Array.isArray(data.suggestions)
            ? data.suggestions
                .map((item) => item.placePrediction)
                .filter((p): p is PlacePrediction => p !== undefined)
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
  }, [query, visible]);

  /**
   * Triggers a detailed place lookup on Google Places API using the chosen place's ID.
   * Extracts coordinate coordinates, builds the location details payload, and bubbles it up.
   *
   * @param {PlacePrediction} place The autocomplete recommendation chosen by the user.
   * @returns {Promise<void>} Resolves when the place detail request completes.
   */
  const handleSelect = async (place: PlacePrediction) => {
    if (!GOOGLE_MAPS_KEY) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://places.googleapis.com/v1/places/${place.placeId}?sessionToken=${sessionToken.current}`,
        {
          headers: {
            "X-Goog-Api-Key": GOOGLE_MAPS_KEY,
            "X-Goog-FieldMask": "id,displayName,formattedAddress,location",
          },
        },
      );

      const data = (await response.json()) as PlaceDetailsResponse;
      const latitude = data.location?.latitude;
      const longitude = data.location?.longitude;

      if (typeof latitude !== "number" || typeof longitude !== "number") {
        throw new Error("Missing coordinates");
      }

      onSelectLocation({
        latitude,
        longitude,
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
   * Requests device foreground location access, retrieves current GPS coordinates,
   * performs a reverse geocode lookup to resolve address lines, and propagates it up.
   *
   * @returns {Promise<void>} Resolves when the device location coordinates are fetched and reverse-geocoded.
   */
  const handleCurrentLocation = async () => {
    setLoading(true);
    setError(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError("Location permission was not granted.");
        return;
      }

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

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-white">
        <View className="flex-row items-center border-b border-neutral-lightest px-4 py-3">
          <TouchableOpacity
            accessibilityRole="button"
            className="h-10 w-10 items-center justify-center"
            onPress={onClose}
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color={colors.neutral.DEFAULT}
            />
          </TouchableOpacity>
          <Text className="flex-1 text-center font-nunito-bold text-[17px] text-neutral-black">
            Event Location
          </Text>
          <View className="h-10 w-10" />
        </View>

        <View className="px-4 py-4">
          <View className="flex-row items-center rounded-2xl border border-neutral-lightest px-3 py-2">
            <Ionicons name="search" size={18} color={colors.neutral.light} />
            <TextInput
              accessibilityLabel="Text input field"
              accessibilityHint="Search for a street, area, or venue."
              className="ml-2 flex-1 font-nunito text-[15px] text-neutral-black"
              value={query}
              onChangeText={setQuery}
              placeholder="Search area, street, venue"
              placeholderTextColor={colors.neutral.light}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {loading ? (
              <ActivityIndicator size="small" color={colors.primary.DEFAULT} />
            ) : null}
          </View>

          <TouchableOpacity
            accessibilityRole="button"
            className="mt-3 flex-row items-center rounded-2xl border border-primary-surface bg-primary-surface px-4 py-3"
            onPress={handleCurrentLocation}
            activeOpacity={0.8}
          >
            <Ionicons
              name="navigate-circle"
              size={22}
              color={colors.primary.DEFAULT}
            />
            <Text className="ml-2 font-nunito-semibold text-[15px] text-primary">
              Use Current Location
            </Text>
          </TouchableOpacity>

          {error ? (
            <Text className="mt-3 font-nunito text-[13px] text-error">
              {error}
            </Text>
          ) : null}
        </View>

        <View className="flex-1 px-4">
          {results.map((item) => (
            <TouchableOpacity
              key={item.placeId}
              accessibilityRole="button"
              className="border-b border-neutral-lightest py-4"
              onPress={() => handleSelect(item)}
              activeOpacity={0.75}
            >
              <Text className="font-nunito-semibold text-[15px] text-neutral-black">
                {item.structuredFormat?.mainText?.text || "Place"}
              </Text>
              <Text className="mt-1 font-nunito text-[13px] text-neutral-light">
                {item.structuredFormat?.secondaryText?.text || ""}
              </Text>
            </TouchableOpacity>
          ))}

          {!loading && query.trim() && results.length === 0 ? (
            <Text className="mt-8 text-center font-nunito text-[14px] text-neutral-light">
              No places found
            </Text>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}
