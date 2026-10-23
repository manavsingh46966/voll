import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { colors, fonts } from "@/constants/theme";

import type { AvailableUser, GroupMember } from "../types/group.types";

type Member = GroupMember | AvailableUser;

interface Props {
  member: Member;
  actionLabel: string;
  actionColor?: string;
  onAction: () => void;
  disabled?: boolean;
}

/**
 * Renders one group member or selectable user row.
 *
 * @param root0
 * @param root0.member
 * @param root0.actionLabel
 * @param root0.actionColor
 * @param root0.onAction
 * @param root0.disabled
 * @returns A member list item with an action button.
 */
export function MemberListItem({
  member,
  actionLabel,
  actionColor,
  onAction,
  disabled,
}: Props) {
  const subtitle =
    "email" in member && member.email
      ? member.email
      : (member.city ?? member.bio ?? "");
  const initials = (member.name || subtitle || "?")
    .split(" ")
    .slice(0, 2)
    .map((w: string) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <View style={styles.container}>
      <View style={styles.avatarWrap}>
        <Text style={styles.initials}>{initials}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {member.name ?? "—"}
        </Text>
        <Text style={styles.email} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <TouchableOpacity
        accessibilityRole="button"
        style={[styles.actionBtn, disabled && styles.disabled]}
        onPress={onAction}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.actionLabel,
            { color: actionColor ?? colors.primary.DEFAULT },
          ]}
        >
          {actionLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.neutral.lightest,
  },
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary.surface,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  initials: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.primary.DEFAULT,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontFamily: fonts.semibold,
    color: colors.neutral.DEFAULT,
  },
  email: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.neutral.light,
    marginTop: 1,
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.neutral.lightest,
  },
  actionLabel: {
    fontSize: 13,
    fontFamily: fonts.semibold,
  },
  disabled: {
    opacity: 0.4,
  },
});
