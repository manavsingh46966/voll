import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import Constants from "expo-constants";
import * as Location from "expo-location";

import { Ionicons } from "@expo/vector-icons";

import { colors } from "@/constants/theme";

import type { EventLocation } from "../../types/event.types";

const GOOGLE_MAPS_KEY: string = Constants.expoConfig?.extra?.mapsApiKey ?? "";

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});

/**
 * Properties expected by the {@link LocationMap} component.
 */
interface Props {
  /**
   * The initial geographical location state to display on the map region.
   */
  location: EventLocation;
  /**
   * Callback triggered when navigating back to the previous screen.
   */
  onBack: () => void;
  /**
   * Callback triggered to confirm the final selected location coordinate and detail object.
   *
   * @param location The verified coordinates and resolved address details.
   */
  onConfirm: (location: EventLocation) => void;
}

/**
 * Generates a simple coordinate-based fallback string when geocoding is unavailable.
 *
 * @param {number} lat The latitude coordinate.
 * @param {number} lng The longitude coordinate.
 * @returns {string} A formatted coordinate string (e.g. "20.593700, 78.962900").
 */
function fallbackAddress(lat: number, lng: number) {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

/**
 * Performs reverse geocoding on a coordinate pair using the Google Maps Geocoding REST API.
 * Returns structured address details including street name, full formatted address, and Google place ID.
 *
 * @param {number} lat The latitude coordinate to reverse geocode.
 * @param {number} lng The longitude coordinate to reverse geocode.
 * @returns {Promise<EventLocation | null>} A promise that resolves to the resolved location object or null.
 */
async function reverseGeocodeWithGoogle(lat: number, lng: number) {
  if (!GOOGLE_MAPS_KEY) return null;

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_KEY}`,
  );
  const data = await response.json();
  const result = data.results?.[0];

  if (!result) return null;

  return {
    latitude: lat,
    longitude: lng,
    name: result.address_components?.[0]?.long_name || "Dropped Pin",
    address: result.formatted_address,
    placeId: result.place_id,
  } satisfies EventLocation;
}

/**
 * Renders the native map picker component allowing users to choose an event location coordinate.
 * Users can tap anywhere on the map to drop a pin, search POIs, drag markers, and confirm coordinates.
 * Operates with reverse geocoding flow using Google Geocoding or fallback Expo Location APIs.
 *
 * @param props The props for the component.
 * @param props.location The default region location values.
 * @param props.onBack Back navigation handler.
 * @param props.onConfirm Finalized selection confirm callback.
 * @returns {React.JSX.Element} The native map selector layout.
 */
export function LocationMap({ location, onBack, onConfirm }: Props) {
  const [selected, setSelected] = useState<EventLocation>(location);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSelected(location);
  }, [location]);

  /**
   * Updates state coordinates, drops a temporary pin, and launches asynchronous geocoding requests.
   * Leverages `reverseGeocodeWithGoogle` or falls back to standard `Location.reverseGeocodeAsync`.
   *
   * @param {number} latitude The picked target latitude.
   * @param {number} longitude The picked target longitude.
   * @returns {Promise<void>} Resolves when the geocoding request and state updates complete.
   */
  const updateFromCoordinates = async (latitude: number, longitude: number) => {
    setLoading(true);
    setSelected((current) => ({
      ...current,
      latitude,
      longitude,
      name: "Dropped Pin",
      address: fallbackAddress(latitude, longitude),
    }));

    try {
      const googleLocation = await reverseGeocodeWithGoogle(
        latitude,
        longitude,
      );
      if (googleLocation) {
        setSelected(googleLocation);
        return;
      }

      const [address] = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
      if (address) {
        setSelected({
          latitude,
          longitude,
          name: address.name || address.street || address.city || "Dropped Pin",
          address: [
            address.name,
            address.street,
            address.city,
            address.region,
            address.postalCode,
            address.country,
          ]
            .filter(Boolean)
            .join(", "),
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const latitude = selected.latitude || 20.5937;
  const longitude = selected.longitude || 78.9629;

  return (
    <View className="flex-1 bg-white">
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude,
          longitude,
          latitudeDelta: 0.012,
          longitudeDelta: 0.012,
        }}
        region={{
          latitude,
          longitude,
          latitudeDelta: 0.012,
          longitudeDelta: 0.012,
        }}
        onPress={(event) => {
          const { latitude: lat, longitude: lng } =
            event.nativeEvent.coordinate;
          updateFromCoordinates(lat, lng);
        }}
        onPoiClick={(event) => {
          const { coordinate, name, placeId } = event.nativeEvent;
          setSelected({
            latitude: coordinate.latitude,
            longitude: coordinate.longitude,
            name,
            placeId,
            address: name,
          });
          updateFromCoordinates(coordinate.latitude, coordinate.longitude);
        }}
      >
        <Marker coordinate={{ latitude, longitude }} />
      </MapView>

      <TouchableOpacity
        accessibilityRole="button"
        className="absolute left-4 top-12 h-11 w-11 items-center justify-center rounded-full bg-white shadow"
        onPress={onBack}
        activeOpacity={0.75}
      >
        <Ionicons
          name="chevron-back"
          size={24}
          color={colors.neutral.DEFAULT}
        />
      </TouchableOpacity>

      <View className="absolute bottom-0 left-0 right-0 rounded-t-3xl bg-white px-5 pb-6 pt-5 shadow">
        <View className="flex-row items-start">
          <View className="mt-1 h-9 w-9 items-center justify-center rounded-full bg-primary-surface">
            <Ionicons
              name="location"
              size={19}
              color={colors.primary.DEFAULT}
            />
          </View>
          <View className="ml-3 flex-1">
            <Text className="font-nunito text-[12px] text-neutral-light">
              Set location
            </Text>
            <Text className="mt-1 font-nunito-bold text-[17px] text-neutral">
              {selected.name || "Dropped Pin"}
            </Text>
            <Text className="mt-1 font-nunito text-[13px] text-neutral-light">
              {selected.address || fallbackAddress(latitude, longitude)}
            </Text>
          </View>
          {loading ? (
            <ActivityIndicator color={colors.primary.DEFAULT} />
          ) : null}
        </View>

        <TouchableOpacity
          accessibilityRole="button"
          className="mt-5 items-center rounded-2xl bg-primary py-4"
          onPress={() => onConfirm(selected)}
          activeOpacity={0.85}
        >
          <Text className="font-nunito-bold text-[16px] text-white">
            Confirm Location
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
