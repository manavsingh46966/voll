/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

import { Ionicons } from "@expo/vector-icons";

import { colors } from "@/constants/theme";

import type { EventLocation } from "../../types/event.types";

const GOOGLE_MAPS_KEY: string = process.env.EXPO_PUBLIC_MAPS_API_KEY ?? "";

const webMapStyle = { width: "100%", height: "100%" };

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

let googleScriptPromise: Promise<void> | null = null;

/**
 * Asynchronously loads the Google Maps JavaScript API script.
 * Injects a script element into the document head if not present and returns a promise
 * that resolves when the Google Maps namespace and Places library are loaded and available.
 *
 * @returns {Promise<void>} Resolves when the script successfully registers.
 */
function loadGoogleMapsScript() {
  if (typeof window === "undefined") return Promise.reject();
  if ((window as any).google?.maps) return Promise.resolve();
  if (googleScriptPromise) return googleScriptPromise;

  googleScriptPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById("google-maps-script");
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", reject);
      return;
    }

    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });

  return googleScriptPromise;
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
 * LocationMap renders a Google Maps picker for Web platforms.
 * Dynamically loads the script, binds click-to-pin, marker drag-and-drop, and place POI selection triggers,
 * and geocodes output coordinates to populate name and formatted address details.
 *
 * @param props The props for the component.
 * @param props.location The default region location values.
 * @param props.onBack Back navigation handler.
 * @param props.onConfirm Finalized selection confirm callback.
 * @returns {React.JSX.Element} The web map selector layout.
 */
export function LocationMap({ location, onBack, onConfirm }: Props) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<any>(null);
  const marker = useRef<any>(null);
  const geocoder = useRef<any>(null);
  const places = useRef<any>(null);
  const [selected, setSelected] = useState<EventLocation>(location);
  const [loading, setLoading] = useState(false);

  /**
   * Internal helper to update selected state and synchronizes map markers / panning location.
   *
   * @param {EventLocation} next The updated location state object.
   * @returns {void}
   */
  const updateSelected = (next: EventLocation) => {
    setSelected(next);
    if (marker.current && next.latitude && next.longitude) {
      marker.current.setPosition({ lat: next.latitude, lng: next.longitude });
    }
    if (mapInstance.current && next.latitude && next.longitude) {
      mapInstance.current.panTo({ lat: next.latitude, lng: next.longitude });
    }
  };

  /**
   * Queries the Google Maps Geocoder API to reverse lookup geographic coordinates.
   * Resolves the street component name and formatted address, then updates state.
   *
   * @param {number} latitude Target latitude to decode.
   * @param {number} longitude Target longitude to decode.
   * @returns {void}
   */
  const reverseGeocode = (latitude: number, longitude: number) => {
    const google = (window as any).google;
    if (!geocoder.current || !google) {
      updateSelected({
        latitude,
        longitude,
        name: "Dropped Pin",
        address: fallbackAddress(latitude, longitude),
      });
      return;
    }

    setLoading(true);
    geocoder.current.geocode(
      { location: { lat: latitude, lng: longitude } },
      (results: any[], status: string) => {
        setLoading(false);
        const result = status === "OK" ? results?.[0] : null;
        updateSelected({
          latitude,
          longitude,
          name:
            result?.address_components?.[0]?.long_name ||
            result?.name ||
            "Dropped Pin",
          address:
            result?.formatted_address || fallbackAddress(latitude, longitude),
          placeId: result?.place_id,
        });
      },
    );
  };

  useEffect(() => {
    let mounted = true;

    (async () => {
      if (!GOOGLE_MAPS_KEY || !mapRef.current) return;
      await loadGoogleMapsScript();
      if (!mounted || !mapRef.current) return;

      const google = (window as any).google;
      const latitude = selected.latitude || 20.5937;
      const longitude = selected.longitude || 78.9629;

      geocoder.current = new google.maps.Geocoder();
      mapInstance.current = new google.maps.Map(mapRef.current, {
        center: { lat: latitude, lng: longitude },
        zoom: 15,
        gestureHandling: "greedy",
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });
      places.current = new google.maps.places.PlacesService(
        mapInstance.current,
      );
      marker.current = new google.maps.Marker({
        position: { lat: latitude, lng: longitude },
        map: mapInstance.current,
        draggable: true,
      });

      marker.current.addListener("dragend", (event: any) => {
        reverseGeocode(event.latLng.lat(), event.latLng.lng());
      });

      mapInstance.current.addListener("click", (event: any) => {
        if (event.placeId && places.current) {
          event.stop();
          places.current.getDetails(
            {
              placeId: event.placeId,
              fields: ["name", "formatted_address", "geometry"],
            },
            (place: any, status: string) => {
              if (status === "OK" && place?.geometry?.location) {
                updateSelected({
                  latitude: place.geometry.location.lat(),
                  longitude: place.geometry.location.lng(),
                  name: place.name,
                  address: place.formatted_address,
                  placeId: event.placeId,
                });
              }
            },
          );
          return;
        }

        reverseGeocode(event.latLng.lat(), event.latLng.lng());
      });
    })();

    return () => {
      mounted = false;
    };
    // Intentionally initialize once per map screen mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const latitude = selected.latitude || 20.5937;
  const longitude = selected.longitude || 78.9629;

  return (
    <View className="flex-1 bg-white">
      <div ref={mapRef} style={webMapStyle} />

      <TouchableOpacity
        accessibilityRole="button"
        className="absolute left-4 top-12 h-11 w-11 items-center justify-center rounded-full bg-white shadow"
        onPress={onBack}
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
        >
          <Text className="font-nunito-bold text-[16px] text-white">
            Confirm Location
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
