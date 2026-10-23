import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { colors } from "@/constants/theme";

import type { NotificationFilter } from "../types/notification.types";

interface NotificationFilterChipsProps {
  selectedFilter: NotificationFilter;
  onSelectFilter: (filter: NotificationFilter) => void;
  unreadCount: number;
}

const FILTERS: { key: NotificationFilter; label: string; icon?: string }[] = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "events", label: "Events & Updates" },
  { key: "social", label: "Social" },
];

export const NotificationFilterChips: React.FC<NotificationFilterChipsProps> = ({
  selectedFilter,
  onSelectFilter,
  unreadCount,
}) => {
  return (
    <View className="py-2">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        {FILTERS.map((item) => {
          const isSelected = selectedFilter === item.key;
          return (
            <Pressable
              key={item.key}
              onPress={() => onSelectFilter(item.key)}
              className={`mr-2 flex-row items-center rounded-full px-4 py-2 transition-all ${
                isSelected ? "bg-primary shadow-sm" : "bg-white"
              }`}
              style={{
                borderWidth: 1,
                borderColor: isSelected
                  ? colors.primary.DEFAULT
                  : colors.neutral.lightest,
              }}
            >
              <Text
                className={`font-nunito-bold text-sm ${
                  isSelected ? "text-white" : "text-neutral-dark"
                }`}
              >
                {item.label}
              </Text>

              {item.key === "unread" && unreadCount > 0 && (
                <View
                  className={`ml-1.5 rounded-full px-2 py-0.5 ${
                    isSelected ? "bg-white/20" : "bg-primary/10"
                  }`}
                >
                  <Text
                    className={`font-nunito-bold text-xs ${
                      isSelected ? "text-white" : "text-primary"
                    }`}
                  >
                    {unreadCount}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};
