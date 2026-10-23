import React, { useState } from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  Alert,
} from "react-native";
import { colors, fonts } from "@/constants/theme";

export interface StoryFollowButtonProps {
  userId: string;
  isFollowing: boolean;
  onPress: (action: "follow" | "unfollow") => Promise<void>;
  disabled?: boolean;
}

/**
 * StoryFollowButton - Displays follow/unfollow button in story header
 * Changes state based on follow status
 */
export function StoryFollowButton({
  userId,
  isFollowing,
  onPress,
  disabled = false,
}: StoryFollowButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleFollowPress = async () => {
    setIsLoading(true);
    try {
      await onPress(isFollowing ? "unfollow" : "follow");
    } catch (error) {
      console.error("Follow action failed:", error);
      Alert.alert(
        "Error",
        isFollowing ? "Failed to unfollow" : "Failed to follow",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnfollowFromDropdown = async () => {
    setShowDropdown(false);
    setIsLoading(true);
    try {
      await onPress("unfollow");
    } catch (error) {
      console.error("Unfollow action failed:", error);
      Alert.alert("Error", "Failed to unfollow");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isFollowing) {
    return (
      <TouchableOpacity
        style={[styles.followButton, disabled && styles.disabled]}
        onPress={handleFollowPress}
        disabled={disabled || isLoading}
        activeOpacity={0.8}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.followButtonText}>Follow</Text>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <View>
      <TouchableOpacity
        style={[styles.followingButton, disabled && styles.disabled]}
        onPress={() => setShowDropdown(!showDropdown)}
        disabled={disabled || isLoading}
        activeOpacity={0.8}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.primary.DEFAULT} />
        ) : (
          <Text style={styles.followingButtonText}>Following ▼</Text>
        )}
      </TouchableOpacity>

      {showDropdown && !isLoading && (
        <View style={styles.dropdownMenu}>
          <TouchableOpacity
            style={styles.dropdownItem}
            onPress={() => setShowDropdown(false)}
          >
            <Text style={styles.dropdownItemText}>Following</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.dropdownItem, styles.dropdownItemDanger]}
            onPress={handleUnfollowFromDropdown}
          >
            <Text style={styles.dropdownItemDangerText}>Unfollow</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.dropdownItem, styles.dropdownItemDanger]}
            onPress={() => setShowDropdown(false)}
          >
            <Text style={styles.dropdownItemDangerText}>Block</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  followButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: colors.primary.DEFAULT,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 100,
  },
  followingButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary.DEFAULT,
    backgroundColor: colors.surface.DEFAULT,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 100,
  },
  followButtonText: {
    fontSize: 14,
    fontFamily: fonts.semibold,
    color: "#fff",
  },
  followingButtonText: {
    fontSize: 14,
    fontFamily: fonts.semibold,
    color: colors.primary.DEFAULT,
  },
  disabled: {
    opacity: 0.5,
  },
  dropdownMenu: {
    position: "absolute",
    top: 50,
    right: 0,
    backgroundColor: colors.surface.DEFAULT,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.neutral.lightest,
    overflow: "hidden",
    minWidth: 140,
    zIndex: 1000,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.lightest,
  },
  dropdownItemDanger: {
    backgroundColor: colors.surface.gray,
  },
  dropdownItemText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.neutral.DEFAULT,
  },
  dropdownItemDangerText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.primary.DEFAULT,
  },
});
