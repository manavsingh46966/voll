import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Href, router } from "expo-router";

import { Feather, Ionicons, MaterialIcons } from "@expo/vector-icons";
import BottomSheet from "@gorhom/bottom-sheet";

import { colors } from "@/constants/theme";
import { useAuthStore } from "@/src/features/auth/stores/auth.store";

import { FollowListBottomSheet } from "../components/FollowListBottomSheet";
import { ProfileActionButton } from "../components/ProfileActionButton";
import { ProfileDetails } from "../components/ProfileDetails";
import { ProfileHeader } from "../components/ProfileHeader";
import { ProfileJoinedEventsTab } from "../components/ProfileJoinedEventsTab";
import { ProfileStats } from "../components/ProfileStats";
import { ProfileStoriesTab } from "../components/ProfileStoriesTab";
import { SkillChip } from "../components/SkillChip";
import { useMyProfile } from "../hooks/useProfile";

type ActiveTab = "events" | "stories" | "about";

/**
 * **Profile Screen**
 * Shows the authenticated user's own private profile with:
 * - Avatar, Name, Stats (Followers/Following)
 * - Quick Actions: Edit Profile, Find People, Logout
 * - Interactive Tabs: Joined Volunteering Events, My Stories, and About/Skills.
 */
export default function ProfileScreen() {
  const {
    data: profile,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useMyProfile();

  const logout = useAuthStore((state) => state.logout);

  const [activeTab, setActiveTab] = useState<ActiveTab>("events");
  const followersSheetRef = useRef<BottomSheet>(null);
  const followingSheetRef = useRef<BottomSheet>(null);
  const [activeSheet, setActiveSheet] = useState<"followers" | "following">(
    "followers",
  );

  const openSheet = (mode: "followers" | "following") => {
    setActiveSheet(mode);
    if (mode === "followers") {
      followersSheetRef.current?.expand();
    } else {
      followingSheetRef.current?.expand();
    }
  };

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out of your account?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: () => {
          logout();
          router.replace("/(drawer)/(tabs)" as unknown as Href);
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
      </SafeAreaView>
    );
  }

  if (isError || !profile) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-surface px-6">
        <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl bg-teal-50">
          <Ionicons name="person-outline" size={32} color={colors.primary.DEFAULT} />
        </View>
        <Text className="font-nunito-bold text-base text-neutral-black">
          Unable to load profile
        </Text>
        <Text className="mt-1 text-center font-nunito text-xs text-neutral-light">
          Pull down to retry or check your connection.
        </Text>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => refetch()}
          className="mt-4 rounded-xl bg-primary px-5 py-2.5"
        >
          <Text className="font-nunito-bold text-sm text-white">Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <>
      <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
        <ScrollView
          className="flex-1 bg-surface"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary.DEFAULT}
            />
          }
          contentContainerStyle={{ paddingBottom: 60 }}
        >
          {/* Top Bar with Settings/Logout */}
          <View className="flex-row items-center justify-between px-5 pt-2">
            <Text className="font-nunito-bold text-xl text-neutral-black">
              My Profile
            </Text>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Account Options"
              onPress={handleLogout}
              className="h-10 w-10 items-center justify-center rounded-full bg-gray-100 active:bg-gray-200"
            >
              <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>

          {/* Avatar, Name, Gender */}
          <ProfileHeader
            name={profile.name}
            gender={profile.gender}
            profileImageUrl={profile.profileImageUrl}
            isEditable={false}
          />

          {/* Followers / Following stats */}
          <ProfileStats
            followersCount={profile.followersCount}
            followingCount={profile.followingCount}
            onFollowersPress={() => openSheet("followers")}
            onFollowingPress={() => openSheet("following")}
          />

          {/* Action Buttons Row */}
          <View className="mx-4 mt-2 flex-row items-center space-x-3">
            <View className="flex-1">
              <ProfileActionButton
                targetUserId={profile.id}
                isOwner={true}
                isFollowing={false}
              />
            </View>

            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Find people to follow"
              onPress={() => router.push("/(drawer)/(tabs)/profile/search")}
              className="flex-row items-center justify-center rounded-xl px-4 py-3.5"
              style={{ backgroundColor: colors.surface.gray }}
            >
              <Ionicons name="person-add-outline" size={18} color={colors.primary.DEFAULT} />
              <Text
                className="ml-2 font-nunito-bold text-sm"
                style={{ color: colors.primary.DEFAULT }}
              >
                Find People
              </Text>
            </TouchableOpacity>
          </View>

          {/* Segmented Tabs Bar */}
          <View className="mx-4 mt-6 flex-row rounded-2xl bg-gray-100 p-1">
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === "events" }}
              onPress={() => setActiveTab("events")}
              className={`flex-1 flex-row items-center justify-center rounded-xl py-2.5 ${
                activeTab === "events" ? "bg-white shadow-sm" : ""
              }`}
            >
              <Ionicons
                name="calendar"
                size={16}
                color={activeTab === "events" ? colors.primary.DEFAULT : "#6B7280"}
              />
              <Text
                className={`ml-1.5 font-nunito-bold text-xs ${
                  activeTab === "events" ? "text-primary" : "text-neutral-gray"
                }`}
              >
                Volunteering
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === "stories" }}
              onPress={() => setActiveTab("stories")}
              className={`flex-1 flex-row items-center justify-center rounded-xl py-2.5 ${
                activeTab === "stories" ? "bg-white shadow-sm" : ""
              }`}
            >
              <Ionicons
                name="book"
                size={16}
                color={activeTab === "stories" ? colors.primary.DEFAULT : "#6B7280"}
              />
              <Text
                className={`ml-1.5 font-nunito-bold text-xs ${
                  activeTab === "stories" ? "text-primary" : "text-neutral-gray"
                }`}
              >
                Stories
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === "about" }}
              onPress={() => setActiveTab("about")}
              className={`flex-1 flex-row items-center justify-center rounded-xl py-2.5 ${
                activeTab === "about" ? "bg-white shadow-sm" : ""
              }`}
            >
              <Ionicons
                name="information-circle"
                size={16}
                color={activeTab === "about" ? colors.primary.DEFAULT : "#6B7280"}
              />
              <Text
                className={`ml-1.5 font-nunito-bold text-xs ${
                  activeTab === "about" ? "text-primary" : "text-neutral-gray"
                }`}
              >
                About
              </Text>
            </Pressable>
          </View>

          {/* Tab Content */}
          {activeTab === "events" && (
            <ProfileJoinedEventsTab isOwner={true} />
          )}

          {activeTab === "stories" && (
            <ProfileStoriesTab authorId="me" isOwner={true} />
          )}

          {activeTab === "about" && (
            <View className="pt-2">
              {/* Bio, City, Phone, Email, Website */}
              <ProfileDetails
                bio={profile.bio}
                phoneNumber={profile.phoneNumber}
                email={profile.email}
                website={profile.website}
                city={profile.city}
              />

              {/* Skills */}
              {profile.skillsets.length > 0 && (
                <View
                  className="mx-4 mt-4 rounded-2xl bg-surface p-4"
                  style={{ borderWidth: 1, borderColor: colors.neutral.lightest }}
                >
                  <Text className="mb-2 font-nunito-bold text-base text-neutral">
                    Skills
                  </Text>
                  <View className="flex-row flex-wrap">
                    {profile.skillsets.map((skill) => (
                      <SkillChip key={skill} label={skill} />
                    ))}
                  </View>
                </View>
              )}

              {/* Interests */}
              {profile.interests.length > 0 && (
                <View
                  className="mx-4 mt-4 rounded-2xl bg-surface p-4"
                  style={{ borderWidth: 1, borderColor: colors.neutral.lightest }}
                >
                  <Text className="mb-2 font-nunito-bold text-base text-neutral">
                    Interests
                  </Text>
                  <View className="flex-row flex-wrap">
                    {profile.interests.map((interest) => (
                      <SkillChip key={interest} label={interest} />
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Followers Bottom Sheet */}
      <FollowListBottomSheet
        userId={profile.id}
        mode="followers"
        sheetRef={followersSheetRef}
      />

      {/* Following Bottom Sheet */}
      <FollowListBottomSheet
        userId={profile.id}
        mode="following"
        sheetRef={followingSheetRef}
      />
    </>
  );
}
