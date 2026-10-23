import React, { useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { colors, fonts } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";

export interface FollowerUser {
  id: string;
  name: string;
  profileImageUrl?: string;
  bio?: string;
  followsYou?: boolean;
}

export interface FollowersBottomSheetProps {
  bottomSheetRef: React.Ref<BottomSheetModal>;
  title: "Followers" | "Following";
  users: FollowerUser[];
  currentUserId: string;
  isLoading: boolean;
  onLoadMore?: () => void;
  onUnfollow?: (userId: string) => void;
  onFollow?: (userId: string) => void;
}

/**
 * FollowersBottomSheet - Displays paginated list of followers/following
 * Allows unfollow action directly from the sheet
 */
export function FollowersBottomSheet({
  bottomSheetRef,
  title,
  users,
  currentUserId,
  isLoading,
  onLoadMore,
  onUnfollow,
  onFollow,
}: FollowersBottomSheetProps) {
  const snapPoints = useMemo(() => ["25%", "85%"], []);

  const handleEndReached = useCallback(() => {
    if (!isLoading && onLoadMore) {
      onLoadMore();
    }
  }, [isLoading, onLoadMore]);

  const renderFollowerCard = useCallback(
    ({ item }: { item: FollowerUser }) => {
      const isCurrentUser = item.id === currentUserId;

      return (
        <View style={styles.followerCard}>
          {/* Avatar & Info */}
          <View style={styles.followerInfo}>
            <Image
              source={{
                uri:
                  item.profileImageUrl ||
                  `https://ui-avatars.com/api/?name=${item.name}`,
              }}
              style={styles.avatar}
            />
            <View style={styles.textContainer}>
              <Text style={styles.followerName}>{item.name}</Text>
              {item.followsYou && !isCurrentUser && (
                <Text style={styles.followsYouBadge}>Follows you</Text>
              )}
              {item.bio && (
                <Text style={styles.bio} numberOfLines={1}>
                  {item.bio}
                </Text>
              )}
            </View>
          </View>

          {/* Action Button */}
          {!isCurrentUser && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onUnfollow?.(item.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.actionButtonText}>Unfollow</Text>
            </TouchableOpacity>
          )}

          {isCurrentUser && (
            <Text style={styles.youBadge}>You</Text>
          )}
        </View>
      );
    },
    [currentUserId, onUnfollow],
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
          <Text style={styles.headerTitle}>{title}</Text>
          <Text style={styles.followerCount}>{users.length}</Text>
        </View>

        {/* Followers List */}
        <FlatList
          data={users}
          renderItem={renderFollowerCard}
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
                  name="people-outline"
                  size={48}
                  color={colors.neutral.light}
                />
                <Text style={styles.emptyText}>
                  No {title.toLowerCase()} yet
                </Text>
              </View>
            ) : null
          }
          contentContainerStyle={styles.listContent}
        />
      </View>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface.DEFAULT,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.lightest,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.neutral.DEFAULT,
  },
  followerCount: {
    fontSize: 14,
    fontFamily: fonts.semibold,
    color: colors.neutral.gray,
  },
  bottomSheetBackground: {
    backgroundColor: colors.surface.DEFAULT,
  },
  handleIndicator: {
    backgroundColor: colors.neutral.lightest,
    width: 48,
    height: 4,
  },
  listContent: {
    paddingBottom: 20,
  },
  followerCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.lightest,
  },
  followerInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    backgroundColor: colors.surface.gray,
  },
  textContainer: {
    flex: 1,
  },
  followerName: {
    fontSize: 14,
    fontFamily: fonts.semibold,
    color: colors.neutral.DEFAULT,
    marginBottom: 2,
  },
  followsYouBadge: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: colors.neutral.gray,
    marginBottom: 4,
  },
  bio: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.neutral.light,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary.DEFAULT,
    backgroundColor: colors.surface.DEFAULT,
  },
  actionButtonText: {
    fontSize: 12,
    fontFamily: fonts.semibold,
    color: colors.primary.DEFAULT,
  },
  youBadge: {
    fontSize: 11,
    fontFamily: fonts.semibold,
    color: colors.neutral.gray,
  },
  loadingContainer: {
    paddingVertical: 16,
    alignItems: "center",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.neutral.light,
    marginTop: 8,
    textAlign: "center",
  },
});
