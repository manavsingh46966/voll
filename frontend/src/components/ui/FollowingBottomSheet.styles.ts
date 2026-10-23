import { StyleSheet } from "react-native";

import { colors, fonts } from "@/constants/theme";

/** Styles for FollowingBottomSheet. */
export const styles = StyleSheet.create({
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
  followingCount: {
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
  followingCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.lightest,
  },
  followingInfo: {
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
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  followingName: {
    fontSize: 14,
    fontFamily: fonts.semibold,
    color: colors.neutral.DEFAULT,
    marginRight: 8,
    flex: 1,
  },
  mutualBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.primary.surface,
    borderRadius: 4,
  },
  mutualBadgeText: {
    fontSize: 10,
    fontFamily: fonts.semibold,
    color: colors.primary.DEFAULT,
  },
  bio: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.neutral.light,
  },
  unfollowButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.neutral.lightest,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface.gray,
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
