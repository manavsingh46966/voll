import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Ionicons } from "@expo/vector-icons";
import BottomSheet from "@gorhom/bottom-sheet";

import { colors } from "@/constants/theme";
import { useSessionStore } from "@/src/stores/session.store";

import { FollowListBottomSheet } from "../components/FollowListBottomSheet";
import { ProfileActionButton } from "../components/ProfileActionButton";
import { ProfileDetails } from "../components/ProfileDetails";
import { ProfileHeader } from "../components/ProfileHeader";
import { ProfileStats } from "../components/ProfileStats";
import { ProfileStoriesTab } from "../components/ProfileStoriesTab";
import { SkillChip } from "../components/SkillChip";
import { useUserProfile } from "../hooks/useProfile";

type ActiveTab = "stories" | "about";

interface Props {
  userId: string;
}

/**
 * **User Profile Screen**
 * Shows a public profile for any user with:
 * - Avatar, Name, Stats (Followers/Following)
 * - Follow / Unfollow actions
 * - Stories Tab and About/Skills Tab.
 */
export default function UserProfileScreen({ userId }: Props) {
  const {
    data: profile,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useUserProfile(userId);
  const { user: sessionUser } = useSessionStore();

  const [activeTab, setActiveTab] = useState<ActiveTab>("stories");
  const followersSheetRef = useRef<BottomSheet>(null);
  const followingSheetRef = useRef<BottomSheet>(null);

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
          User Not Found
        </Text>
        <Text className="mt-1 text-center font-nunito text-xs text-neutral-light">
          This user profile is unavailable or no longer exists.
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
          contentContainerStyle={{ paddingBottom: 50 }}
        >
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
            onFollowersPress={() => followersSheetRef.current?.expand()}
            onFollowingPress={() => followingSheetRef.current?.expand()}
          />

          {/* Follow / Unfollow button */}
          {sessionUser ? (
            <View className="mx-4 mt-2">
              <ProfileActionButton
                targetUserId={profile.id}
                isOwner={profile.isOwner}
                isFollowing={profile.isFollowing}
              />
            </View>
          ) : null}

          {/* Segmented Tabs Bar */}
          <View className="mx-4 mt-6 flex-row rounded-2xl bg-gray-100 p-1">
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
          {activeTab === "stories" && (
            <ProfileStoriesTab authorId={profile.id} isOwner={false} />
          )}

          {activeTab === "about" && (
            <View className="pt-2">
              <ProfileDetails
                bio={profile.bio}
                phoneNumber={profile.phoneNumber}
                email={profile.email}
                website={profile.website}
                city={profile.city}
              />

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

      <FollowListBottomSheet
        userId={profile.id}
        mode="followers"
        sheetRef={followersSheetRef}
      />
      <FollowListBottomSheet
        userId={profile.id}
        mode="following"
        sheetRef={followingSheetRef}
      />
    </>
  );
}
