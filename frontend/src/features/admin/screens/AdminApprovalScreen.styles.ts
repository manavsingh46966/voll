import { StyleSheet } from "react-native";

import { colors, fonts } from "@/constants/theme";

/** Styles for the admin approval queue screen. */
export const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface.DEFAULT },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.neutral.lightest,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: fonts.bold,
    color: colors.neutral.DEFAULT,
  },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContainer: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.neutral.lightest,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  eventTitle: {
    flex: 1,
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.neutral.DEFAULT,
    marginRight: 12,
  },
  badgeText: {
    backgroundColor: colors.surface.yellow,
    color: "#fff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    fontSize: 12,
    fontFamily: fonts.semibold,
    overflow: "hidden",
  },
  organizerText: {
    fontSize: 14,
    fontFamily: fonts.semibold,
    color: colors.neutral.gray,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.neutral.light,
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.neutral.DEFAULT,
    marginBottom: 16,
    lineHeight: 20,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.neutral.lightest,
    paddingTop: 12,
  },
  approveBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary.DEFAULT,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
  },
  approveText: {
    color: "#fff",
    fontFamily: fonts.semibold,
    fontSize: 14,
  },
  disabled: {
    opacity: 0.5,
  },
  emptyContainer: {
    paddingTop: 80,
    alignItems: "center",
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: fonts.semibold,
    color: colors.neutral.light,
  },
});
