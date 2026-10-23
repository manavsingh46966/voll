import React, { useMemo } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";

import { LocationMap } from "@/src/features/createEvent/components/location/LocationMap";
import { useCreateEventStore } from "@/src/features/createEvent/stores/createEvent.store";
import type { EventLocation } from "@/src/features/createEvent/types/event.types";

const fallbackLocation: EventLocation = {
  latitude: 20.5937,
  longitude: 78.9629,
  name: "India",
  address: "India",
};

/**
 * Opens the map confirmation modal for the create-event location picker.
 *
 * @returns The event location map modal route.
 */
export default function EventLocationMapModal() {
  const { location } = useLocalSearchParams<{ location?: string }>();
  const { formData, updateData } = useCreateEventStore();

  const initialLocation = useMemo(() => {
    if (location) {
      try {
        return JSON.parse(location) as EventLocation;
      } catch {
        return formData.location || fallbackLocation;
      }
    }

    return formData.location?.latitude && formData.location?.longitude
      ? formData.location
      : fallbackLocation;
  }, [formData.location, location]);

  const handleConfirm = (selected: EventLocation) => {
    updateData({
      location: selected,
      city: selected.address || selected.name || "",
    });
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
      <LocationMap
        location={initialLocation}
        onBack={() => router.back()}
        onConfirm={handleConfirm}
      />
    </SafeAreaView>
  );
}
