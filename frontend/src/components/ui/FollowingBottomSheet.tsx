import React, { useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModal } from "@gorhom/bottom-sheet";

import { colors } from "@/constants/theme";

import { styles } from "./FollowingBottomSheet.styles";

export interface FollowingUser {
  id: string;
  name: string;
  profileImageUrl?: string;
  bio?: string;
  followsYouBack?: boolean;
}

export interface FollowingBottomSheetProps {
  bottomSheetRef: React.Ref<BottomSheetModal>;
  users: FollowingUser[];
  currentUserId: string;
  isLoading: boolean;
  onLoadMore?: () => void;
  onUnfollow?: (userId: string) => void;
}

/**
 * FollowingBottomSheet - Displays paginated list of users being followed
 * Allows unfollow action directly from the sheet
 *
 * @param props - Sheet ref, users, current user id, loading flag and callbacks.
 * @param props.bottomSheetRef
 * @param props.users
 * @param props.currentUserId
 * @param props.isLoading
 * @param props.onLoadMore
 * @param props.onUnfollow
 * @returns The bottom sheet modal listing followed users.
 */
export function FollowingBottomSheet({
  bottomSheetRef,
  users,
  currentUserId,
  isLoading,
  onLoadMore,
  onUnfollow,
}: FollowingBottomSheetProps) {
  const snapPoints = useMemo(() => ["25%", "85%"], []);

  const handleEndReached = useCallback(() => {
    if (!isLoading && onLoadMore) {
      onLoadMore();
    }
  }, [isLoading, onLoadMore]);

  const renderFollowingCard = useCallback(
    ({ item }: { item: FollowingUser }) => {
      return (
        <View style={styles.followingCard}>
          {/* Avatar & Info */}
          <View style={styles.followingInfo}>
            <Image
              source={{
                uri:
                  item.profileImageUrl ||
                  `https://ui-avatars.com/api/?name=${item.name}`,
              }}
              style={styles.avatar}
            />
            <View style={styles.textContainer}>
              <View style={styles.nameRow}>
                <Text style={styles.followingName}>{item.name}</Text>
                {item.followsYouBack && (
                  <View style={styles.mutualBadge}>
                    <Text style={styles.mutualBadgeText}>Follows back</Text>
                  </View>
                )}
              </View>
              {item.bio && (
                <Text style={styles.bio} numberOfLines={1}>
                  {item.bio}
                </Text>
              )}
            </View>
          </View>

          {/* Unfollow Button */}
          <TouchableOpacity
            accessibilityRole="button"
            style={styles.unfollowButton}
            onPress={() => onUnfollow?.(item.id)}
            activeOpacity={0.7}
          >
            <Ionicons name="checkmark" size={16} color={colors.neutral.gray} />
          </TouchableOpacity>
        </View>
      );
    },
    [onUnfollow],
  );

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      backgroundStyle={styles.bottomSheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Following</Text>
          <Text style={styles.followingCount}>{users.length}</Text>
        </View>

        {/* Following List */}
        <FlatList
          data={users}
          renderItem={renderFollowingCard}
          keyExtractor={(item) => item.id}
          scrollEnabled
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator
                  size="small"
                  color={colors.primary.DEFAULT}
                />
              </View>
            ) : null
          }
          ListEmptyComponent={
            !isLoading ? (
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="person-outline"
                  size={48}
                  color={colors.neutral.light}
                />
                <Text style={styles.emptyText}>Not following anyone yet</Text>
              </View>
            ) : null
          }
          contentContainerStyle={styles.listContent}
        />
      </View>
    </BottomSheetModal>
  );
}
