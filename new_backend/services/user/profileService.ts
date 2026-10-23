import mongoose from "mongoose";
import { FollowModel } from "../../models/follow.ts";
import { UserModel } from "../../models/user.ts";
import { createNotification } from "../notification/notificationService.ts";
import { type Result } from "../../types/common/result.ts";

export interface UpdateProfileInput {
  name?: string;
  gender?: string | null;
  bio?: string;
  city?: string | null;
  website?: string | null;
  skillsets?: string[];
  interests?: string[];
  showMobileNumber?: boolean;
  showEmail?: boolean;
  showWebsite?: boolean;
}

/**
 * Gets the authenticated user's private profile.
 */
export async function getMyProfileService(userId: string): Promise<Result<any>> {
  try {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const user = await UserModel.findById(userObjectId).lean();

    if (!user) {
      return { success: false, errorType: "NOT_FOUND", message: "User not found." };
    }

    const [followersCount, followingCount] = await Promise.all([
      FollowModel.countDocuments({ following: userObjectId }),
      FollowModel.countDocuments({ follower: userObjectId }),
    ]);

    const profile = {
      id: String(user._id),
      _id: String(user._id),
      name: user.name || "",
      email: user.email,
      phoneNumber: user.phoneNumber || null,
      gender: user.gender || null,
      city: user.city || null,
      bio: (user as any).bio || "",
      profileImageUrl: (user as any).profileImageUrl || null,
      website: user.website || null,
      interests: user.interests || [],
      skillsets: user.skillsets || [],
      showMobileNumber: (user as any).showMobileNumber ?? true,
      showEmail: (user as any).showEmail ?? true,
      showWebsite: (user as any).showWebsite ?? true,
      followersCount,
      followingCount,
      role: user.role,
      accountStatus: user.accountStatus,
    };

    return { success: true, data: profile };
  } catch (error) {
    console.error("[ProfileService] getMyProfileService error:", error);
    return { success: false, errorType: "INTERNAL_ERROR", message: "Failed to fetch profile." };
  }
}

/**
 * Gets another user's public profile with respect to privacy settings and viewer relation.
 */
export async function getUserProfileService(
  viewerId: string | undefined,
  targetUserId: string,
): Promise<Result<any>> {
  try {
    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      return { success: false, errorType: "BAD_REQUEST", message: "Invalid user ID." };
    }

    const targetObjectId = new mongoose.Types.ObjectId(targetUserId);
    const targetUser = await UserModel.findById(targetObjectId).lean();

    if (!targetUser) {
      return { success: false, errorType: "NOT_FOUND", message: "User not found." };
    }

    const isOwner = viewerId ? String(viewerId) === String(targetUserId) : false;

    let isFollowing = false;
    if (viewerId && !isOwner) {
      const followDoc = await FollowModel.findOne({
        follower: new mongoose.Types.ObjectId(viewerId),
        following: targetObjectId,
      }).lean();
      isFollowing = !!followDoc;
    }

    const [followersCount, followingCount] = await Promise.all([
      FollowModel.countDocuments({ following: targetObjectId }),
      FollowModel.countDocuments({ follower: targetObjectId }),
    ]);

    const showMobile = (targetUser as any).showMobileNumber ?? true;
    const showEmail = (targetUser as any).showEmail ?? true;
    const showWebsite = (targetUser as any).showWebsite ?? true;

    const publicProfile = {
      id: String(targetUser._id),
      _id: String(targetUser._id),
      name: targetUser.name || null,
      gender: targetUser.gender || null,
      city: targetUser.city || null,
      bio: (targetUser as any).bio || "",
      profileImageUrl: (targetUser as any).profileImageUrl || null,
      website: isOwner || showWebsite ? targetUser.website || null : null,
      phoneNumber: isOwner || showMobile ? targetUser.phoneNumber || null : null,
      email: isOwner || showEmail ? targetUser.email || null : null,
      interests: targetUser.interests || [],
      skillsets: targetUser.skillsets || [],
      showMobileNumber: showMobile,
      showEmail: showEmail,
      showWebsite: showWebsite,
      followersCount,
      followingCount,
      isFollowing,
      isOwner,
    };

    return { success: true, data: publicProfile };
  } catch (error) {
    console.error("[ProfileService] getUserProfileService error:", error);
    return { success: false, errorType: "INTERNAL_ERROR", message: "Failed to fetch user profile." };
  }
}

/**
 * Partially updates the authenticated user's profile.
 */
export async function updateMyProfileService(
  userId: string,
  data: UpdateProfileInput,
): Promise<Result<{ updated: true }>> {
  try {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const updatePayload: Record<string, any> = {};

    if (data.name !== undefined) updatePayload.name = data.name.trim();
    if (data.gender !== undefined) updatePayload.gender = data.gender;
    if (data.bio !== undefined) updatePayload.bio = data.bio.trim();
    if (data.city !== undefined) updatePayload.city = data.city ? data.city.trim() : null;
    if (data.website !== undefined) updatePayload.website = data.website ? data.website.trim() : null;
    if (data.skillsets !== undefined) updatePayload.skillsets = data.skillsets;
    if (data.interests !== undefined) updatePayload.interests = data.interests;
    if (data.showMobileNumber !== undefined) updatePayload.showMobileNumber = data.showMobileNumber;
    if (data.showEmail !== undefined) updatePayload.showEmail = data.showEmail;
    if (data.showWebsite !== undefined) updatePayload.showWebsite = data.showWebsite;

    const user = await UserModel.findByIdAndUpdate(
      userObjectId,
      { $set: updatePayload },
      { new: true, runValidators: true },
    );

    if (!user) {
      return { success: false, errorType: "NOT_FOUND", message: "User not found." };
    }

    return { success: true, data: { updated: true } };
  } catch (error) {
    console.error("[ProfileService] updateMyProfileService error:", error);
    return { success: false, errorType: "INTERNAL_ERROR", message: "Failed to update profile." };
  }
}

/**
 * Updates the user's profile photo URL.
 */
export async function updateProfilePhotoService(
  userId: string,
  profileImageUrl: string | null,
): Promise<Result<{ profileImageUrl: string | null }>> {
  try {
    const user = await UserModel.findByIdAndUpdate(
      new mongoose.Types.ObjectId(userId),
      { $set: { profileImageUrl } },
      { new: true },
    );

    if (!user) {
      return { success: false, errorType: "NOT_FOUND", message: "User not found." };
    }

    return { success: true, data: { profileImageUrl } };
  } catch (error) {
    return { success: false, errorType: "INTERNAL_ERROR", message: "Failed to update photo." };
  }
}

/**
 * Follows a user and triggers a notification.
 */
export async function followUserService(
  followerId: string,
  followingId: string,
): Promise<Result<{ followersCount: number }>> {
  try {
    if (followerId === followingId) {
      return { success: false, errorType: "BAD_REQUEST", message: "You cannot follow yourself." };
    }

    const followerObjectId = new mongoose.Types.ObjectId(followerId);
    const followingObjectId = new mongoose.Types.ObjectId(followingId);

    const [followerUser, targetUser] = await Promise.all([
      UserModel.findById(followerObjectId).lean(),
      UserModel.findById(followingObjectId).lean(),
    ]);

    if (!targetUser) {
      return { success: false, errorType: "NOT_FOUND", message: "User to follow not found." };
    }

    await FollowModel.findOneAndUpdate(
      { follower: followerObjectId, following: followingObjectId },
      { $setOnInsert: { follower: followerObjectId, following: followingObjectId } },
      { upsert: true, new: true },
    );

    const followersCount = await FollowModel.countDocuments({ following: followingObjectId });

    // Trigger notification to followed user
    await createNotification({
      recipient: followingId,
      sender: followerId,
      type: "user_follow",
      title: "New Follower",
      message: `${followerUser?.name || "A volunteer"} started following you!`,
      data: { userId: followerId },
    });

    return { success: true, data: { followersCount } };
  } catch (error) {
    console.error("[ProfileService] followUserService error:", error);
    return { success: false, errorType: "INTERNAL_ERROR", message: "Failed to follow user." };
  }
}

/**
 * Unfollows a user.
 */
export async function unfollowUserService(
  followerId: string,
  followingId: string,
): Promise<Result<{ followersCount: number }>> {
  try {
    const followerObjectId = new mongoose.Types.ObjectId(followerId);
    const followingObjectId = new mongoose.Types.ObjectId(followingId);

    await FollowModel.findOneAndDelete({
      follower: followerObjectId,
      following: followingObjectId,
    });

    const followersCount = await FollowModel.countDocuments({ following: followingObjectId });
    return { success: true, data: { followersCount } };
  } catch (error) {
    return { success: false, errorType: "INTERNAL_ERROR", message: "Failed to unfollow user." };
  }
}

/**
 * Gets paginated followers list.
 */
export async function getFollowersService(
  viewerId: string | undefined,
  targetUserId: string,
  cursor?: string,
  limit = 20,
): Promise<Result<{ users: any[]; nextCursor: string | null }>> {
  try {
    const followingObjectId = new mongoose.Types.ObjectId(targetUserId);
    const query: Record<string, any> = { following: followingObjectId };

    if (cursor) {
      const cursorDate = new Date(cursor);
      if (!Number.isNaN(cursorDate.getTime())) {
        query.createdAt = { $lt: cursorDate };
      }
    }

    const followDocs = await FollowModel.find(query)
      .populate("follower", "name profileImageUrl bio city")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    let viewerFollowingIds = new Set<string>();
    if (viewerId) {
      const viewerObjectId = new mongoose.Types.ObjectId(viewerId);
      const viewerFollows = await FollowModel.find({
        follower: viewerObjectId,
      }).lean();
      viewerFollowingIds = new Set(viewerFollows.map((f) => f.following.toString()));
    }

    const users = followDocs
      .filter((f) => f.follower)
      .map((f: any) => {
        const u = f.follower;
        const uid = String(u._id);
        return {
          id: uid,
          name: u.name || null,
          profileImageUrl: u.profileImageUrl || null,
          bio: u.bio || "",
          city: u.city || null,
          isFollowing: viewerFollowingIds.has(uid),
          isOwner: viewerId ? viewerId === uid : false,
        };
      });

    const nextCursor =
      followDocs.length === limit
        ? followDocs[followDocs.length - 1].createdAt.toISOString()
        : null;

    return { success: true, data: { users, nextCursor } };
  } catch (error) {
    return { success: false, errorType: "INTERNAL_ERROR", message: "Failed to fetch followers." };
  }
}

/**
 * Gets paginated following list.
 */
export async function getFollowingService(
  viewerId: string | undefined,
  targetUserId: string,
  cursor?: string,
  limit = 20,
): Promise<Result<{ users: any[]; nextCursor: string | null }>> {
  try {
    const followerObjectId = new mongoose.Types.ObjectId(targetUserId);
    const query: Record<string, any> = { follower: followerObjectId };

    if (cursor) {
      const cursorDate = new Date(cursor);
      if (!Number.isNaN(cursorDate.getTime())) {
        query.createdAt = { $lt: cursorDate };
      }
    }

    const followDocs = await FollowModel.find(query)
      .populate("following", "name profileImageUrl bio city")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    let viewerFollowingIds = new Set<string>();
    if (viewerId) {
      const viewerObjectId = new mongoose.Types.ObjectId(viewerId);
      const viewerFollows = await FollowModel.find({
        follower: viewerObjectId,
      }).lean();
      viewerFollowingIds = new Set(viewerFollows.map((f) => f.following.toString()));
    }

    const users = followDocs
      .filter((f) => f.following)
      .map((f: any) => {
        const u = f.following;
        const uid = String(u._id);
        return {
          id: uid,
          name: u.name || null,
          profileImageUrl: u.profileImageUrl || null,
          bio: u.bio || "",
          city: u.city || null,
          isFollowing: viewerFollowingIds.has(uid),
          isOwner: viewerId ? viewerId === uid : false,
        };
      });

    const nextCursor =
      followDocs.length === limit
        ? followDocs[followDocs.length - 1].createdAt.toISOString()
        : null;

    return { success: true, data: { users, nextCursor } };
  } catch (error) {
    return { success: false, errorType: "INTERNAL_ERROR", message: "Failed to fetch following." };
  }
}

/**
 * Searches users by query string across name, city, skillsets, interests.
 */
export async function searchUsersService(
  viewerId: string | undefined,
  q: string,
  cursor?: string,
  limit = 20,
): Promise<Result<{ users: any[]; nextCursor: string | null }>> {
  try {
    const trimmed = q.trim();
    if (!trimmed) {
      return { success: true, data: { users: [], nextCursor: null } };
    }

    const query: Record<string, any> = {
      $or: [
        { name: { $regex: trimmed, $options: "i" } },
        { city: { $regex: trimmed, $options: "i" } },
        { skillsets: { $in: [new RegExp(trimmed, "i")] } },
        { interests: { $in: [new RegExp(trimmed, "i")] } },
      ],
    };

    if (viewerId) {
      query._id = { $ne: new mongoose.Types.ObjectId(viewerId) };
    }

    if (cursor) {
      const cursorDate = new Date(cursor);
      if (!Number.isNaN(cursorDate.getTime())) {
        query.createdAt = { $lt: cursorDate };
      }
    }

    const users = await UserModel.find(query)
      .select("name city bio profileImageUrl skillsets interests createdAt")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    let viewerFollowingIds = new Set<string>();
    let viewerFollowerIds = new Set<string>();

    if (viewerId) {
      const viewerObjectId = new mongoose.Types.ObjectId(viewerId);
      const [follows, followers] = await Promise.all([
        FollowModel.find({ follower: viewerObjectId }).lean(),
        FollowModel.find({ following: viewerObjectId }).lean(),
      ]);
      viewerFollowingIds = new Set(follows.map((f) => f.following.toString()));
      viewerFollowerIds = new Set(followers.map((f) => f.follower.toString()));
    }

    const cards = await Promise.all(
      users.map(async (u: any) => {
        const uid = String(u._id);
        const followersCount = await FollowModel.countDocuments({ following: u._id });
        return {
          id: uid,
          name: u.name || null,
          city: u.city || null,
          bio: u.bio || "",
          profileImageUrl: u.profileImageUrl || null,
          followersCount,
          isFollowing: viewerFollowingIds.has(uid),
          followsYou: viewerFollowerIds.has(uid),
        };
      }),
    );

    const nextCursor =
      users.length === limit
        ? (users[users.length - 1] as any).createdAt.toISOString()
        : null;

    return { success: true, data: { users: cards, nextCursor } };
  } catch (error) {
    console.error("[ProfileService] searchUsersService error:", error);
    return { success: false, errorType: "INTERNAL_ERROR", message: "Failed to search users." };
  }
}
