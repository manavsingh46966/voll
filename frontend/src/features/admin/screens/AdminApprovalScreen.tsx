import React from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Redirect } from "expo-router";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { colors } from "@/constants/theme";
import {
  approveEventApi,
  fetchPendingApprovalEventsApi,
} from "@/src/features/createEvent/api/event.api";
import type { Event } from "@/src/features/createEvent/types/event.types";
import { useSessionStore } from "@/src/stores/session.store";

import { styles } from "./AdminApprovalScreen.styles";

/**
 * Admin approval queue: lists events pending approval and lets users with
 * `event:approve` (or superadmins) publish them. Others are redirected home.
 *
 * @returns The approval queue, or a redirect for unauthorised users.
 */
export default function AdminApprovalScreen(): React.JSX.Element {
  const { user } = useSessionStore();
  const queryClient = useQueryClient();

  const {
    data: events,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["admin-pending-events"],
    queryFn: fetchPendingApprovalEventsApi,
    enabled:
      user?.role === "superadmin" ||
      (user?.permissions?.includes("event:approve") ?? false),
  });

  const approveMutation = useMutation({
    mutationFn: approveEventApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pending-events"] });
      Alert.alert("Success", "Event approved and published.");
    },
    onError: () => {
      Alert.alert("Error", "Failed to approve event.");
    },
  });

  if (
    user?.role !== "superadmin" &&
    !(user?.permissions?.includes("event:approve") ?? false)
  ) {
    return <Redirect href="/(drawer)/(tabs)/home" />;
  }

  const renderEvent = ({ item }: { item: Event }) => {
    const startDate = new Date(item.fromDateTime).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.eventTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.badgeText}>Pending</Text>
        </View>
        <Text style={styles.organizerText}>
          By: {item.createdBy?.name || "Unknown"}
        </Text>
        <Text style={styles.dateText}>Start: {startDate}</Text>
        <Text style={styles.descriptionText} numberOfLines={3}>
          {item.description}
        </Text>

        <View style={styles.actions}>
          <TouchableOpacity
            accessibilityRole="button"
            style={[
              styles.approveBtn,
              approveMutation.isPending && styles.disabled,
            ]}
            onPress={() => approveMutation.mutate(item._id)}
            disabled={approveMutation.isPending}
          >
            <MaterialCommunityIcons
              name="check-circle-outline"
              size={20}
              color="#fff"
            />
            <Text style={styles.approveText}>Approve Event</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Approval Queue</Text>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item._id}
          renderItem={renderEvent}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              colors={[colors.primary.DEFAULT]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                name="check-all"
                size={64}
                color={colors.neutral.lightest}
              />
              <Text style={styles.emptyText}>No pending events.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
