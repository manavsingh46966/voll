import mongoose from "mongoose";
import sanitizeHtml from "sanitize-html";
import { CommentModel } from "../../models/comment.ts";
import { LikeModel } from "../../models/like.ts";
import { StoryModel } from "../../models/story.ts";
import { StoryViewModel } from "../../models/storyView.ts";
import { UserModel } from "../../models/user.ts";
import { createNotification } from "../notification/notificationService.ts";
import { type CreateStory, type UpdateStory } from "../../schemas/story.ts";
import type { UserBasicDetails } from "../../schemas/userBasicDetails.ts";
import { type Result, type ErrorType } from "../../types/common/result.ts";
import { violatesModeration } from "../../utils/moderation.ts";

class ServiceException extends Error {
  constructor(public errorType: ErrorType, message: string) {
    super(message);
    this.name = "ServiceException";
  }
}

const ALLOWED_IMAGE_MIMES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function sanitizeMarkdown(markdown: string) {
  return sanitizeHtml(markdown, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img"]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ["src", "alt", "width", "height"],
    },
  });
}

function resolveBannerImageUrl(story: Record<string, any>) {
  if (
    typeof story.bannerImageData === "string" &&
    story.bannerImageData &&
    typeof story.bannerImageMimeType === "string" &&
    story.bannerImageMimeType
  ) {
    return `data:${story.bannerImageMimeType};base64,${story.bannerImageData}`;
  }
  if (typeof story.bannerImageUrl === "string") {
    return story.bannerImageUrl;
  }
  return "";
}

function normalizeStoryPayload(story: any) {
  const raw = typeof story?.toObject === "function" ? story.toObject() : story;
  const payload: Record<string, any> = {
    ...raw,
    bannerImageUrl: resolveBannerImageUrl(raw),
  };
  delete payload.bannerImageData;
  delete payload.bannerImageMimeType;
  return payload;
}

function isDuplicateKeyError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as any).code === 11000
  );
}

function canManageStory(actor: UserBasicDetails, ownerId: unknown): boolean {
  if (actor.role === "superadmin") return true;
  if (actor.permissions.includes("story:manage:any")) return true;
  return String(ownerId) === actor.id;
}

function canApproveStory(actor: UserBasicDetails): boolean {
  return actor.role === "superadmin" || actor.permissions.includes("story:approve");
}

export async function getStories(
  limit = 10,
  cursor?: string,
  userId?: string,
  authorId?: string,
): Promise<Result<any[]>> {
  try {
    const query: Record<string, unknown> = { isDeleted: false };
    const isOwnStoriesRequest = !!authorId && !!userId && authorId === userId;
    
    if (!isOwnStoriesRequest) {
      query.status = "published";
    }

    if (authorId) {
      query.author = new mongoose.Types.ObjectId(authorId);
    }

    if (cursor) {
      const cursorDate = new Date(cursor);
      if (Number.isNaN(cursorDate.getTime())) {
        return { success: false, errorType: "BAD_REQUEST", message: "Invalid cursor." };
      }
      query.createdAt = { $lt: cursorDate };
    }

    const stories = await StoryModel.find(query)
      .select("+bannerImageData")
      .populate("author", "name")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    let likedStoryIds = new Set<string>();
    if (userId && stories.length > 0) {
      const storyIds = stories.map((story) => story._id);
      const userObjectId = new mongoose.Types.ObjectId(userId);
      const userLikes = await LikeModel.find({
        targetId: { $in: storyIds },
        userId: userObjectId,
        targetType: "Story",
      }).lean();
      userLikes.forEach((like) => likedStoryIds.add(like.targetId.toString()));
    }

    const payload = stories.map((story: any) => ({
      ...normalizeStoryPayload(story),
      isLiked: likedStoryIds.has(story._id.toString()),
    }));

    return { success: true, data: payload };
  } catch {
    return { success: false, errorType: "INTERNAL_ERROR", message: "Failed to fetch stories." };
  }
}

export async function getStoryById(
  id: string,
  userId?: string,
): Promise<Result<any | null>> {
  try {
    const storyVisibilityQuery: Record<string, unknown> = {
      _id: id,
      isDeleted: false,
      status: "published",
    };
    
    if (userId) {
      storyVisibilityQuery.$or = [
        { status: "published" },
        { author: new mongoose.Types.ObjectId(userId) },
      ];
      delete storyVisibilityQuery.status;
    }

    const story = await StoryModel.findOne(storyVisibilityQuery)
      .select("+bannerImageData")
      .populate("author", "name")
      .lean();
      
    if (!story) {
      return { success: false, errorType: "NOT_FOUND", message: "Story not found." };
    }

    let isLiked = false;
    if (userId) {
      const userObjectId = new mongoose.Types.ObjectId(userId);
      const like = await LikeModel.findOne({
        targetId: story._id,
        userId: userObjectId,
        targetType: "Story",
      }).lean();
      isLiked = !!like;
    }

    const payload = { ...normalizeStoryPayload(story), isLiked };
    return { success: true, data: payload };
  } catch {
    return { success: false, errorType: "INTERNAL_ERROR", message: "Failed to fetch story." };
  }
}

export async function createStory(
  authorId: string,
  data: CreateStory,
): Promise<Result<any>> {
  try {
    const moderationText = `${data.title}\n${data.bodyMarkdown}`;
    if (violatesModeration(moderationText)) {
      return { success: false, errorType: "FORBIDDEN", message: "Content violates moderation policy." };
    }

    const storyData: Record<string, unknown> = {
      ...data,
      bodyMarkdown: sanitizeMarkdown(data.bodyMarkdown),
      author: authorId,
      status: "draft",
    };

    if (
      typeof data.bannerImageData === "string" &&
      data.bannerImageData &&
      typeof data.bannerImageMimeType === "string" &&
      data.bannerImageMimeType
    ) {
      if (!ALLOWED_IMAGE_MIMES.includes(data.bannerImageMimeType.trim())) {
        return { success: false, errorType: "BAD_REQUEST", message: "Invalid image format." };
      }
      storyData.bannerImageData = data.bannerImageData;
      storyData.bannerImageMimeType = data.bannerImageMimeType.trim();
      storyData.bannerImageUrl = undefined;
    } else if (typeof data.bannerImageUrl === "string" && data.bannerImageUrl.trim()) {
      storyData.bannerImageUrl = data.bannerImageUrl.trim();
      storyData.bannerImageData = undefined;
      storyData.bannerImageMimeType = undefined;
    } else {
      storyData.bannerImageUrl = undefined;
      storyData.bannerImageData = undefined;
      storyData.bannerImageMimeType = undefined;
    }

    const story = new StoryModel(storyData);
    await story.save();
    return { success: true, data: normalizeStoryPayload(story) };
  } catch {
    return { success: false, errorType: "INTERNAL_ERROR", message: "Failed to create story." };
  }
}

export async function updateStory(
  id: string,
  actor: UserBasicDetails,
  data: UpdateStory,
): Promise<Result<any | null>> {
  try {
    const existing = await StoryModel.findOne({ _id: id, isDeleted: false }).lean();
    if (!existing) {
      return { success: false, errorType: "NOT_FOUND", message: "Story not found." };
    }
    if (!canManageStory(actor, existing.author)) {
      return { success: false, errorType: "FORBIDDEN", message: "Story not found or unauthorized." };
    }
    
    // THE FIX: Only block the action if a non-admin is trying to set the status to "published".
    // This allows the controller's "pending_approval" downgrade to pass through successfully.
    if (data.status === "published" && !canApproveStory(actor)) {
      return { success: false, errorType: "FORBIDDEN", message: "Unauthorized story approval." };
    }

    if (typeof data.title === "string" && violatesModeration(data.title)) {
      return { success: false, errorType: "FORBIDDEN", message: "Content violates moderation policy." };
    }
    if (typeof data.bodyMarkdown === "string" && violatesModeration(data.bodyMarkdown)) {
      return { success: false, errorType: "FORBIDDEN", message: "Content violates moderation policy." };
    }

    const setData: Record<string, unknown> = { ...data };
    const unsetData: Record<string, 1> = {};
    if (typeof setData.bodyMarkdown === "string") {
      setData.bodyMarkdown = sanitizeMarkdown(setData.bodyMarkdown);
    }

    if (
      typeof data.bannerImageData === "string" &&
      data.bannerImageData &&
      typeof data.bannerImageMimeType === "string" &&
      data.bannerImageMimeType
    ) {
      if (!ALLOWED_IMAGE_MIMES.includes(data.bannerImageMimeType.trim())) {
        return { success: false, errorType: "BAD_REQUEST", message: "Invalid image format." };
      }
      setData.bannerImageData = data.bannerImageData;
      setData.bannerImageMimeType = data.bannerImageMimeType.trim();
      delete setData.bannerImageUrl;
      unsetData.bannerImageUrl = 1;
    } else if (data.bannerImageUrl === "" || data.bannerImageData === "") {
      delete setData.bannerImageUrl;
      delete setData.bannerImageData;
      delete setData.bannerImageMimeType;
      unsetData.bannerImageUrl = 1;
      unsetData.bannerImageData = 1;
      unsetData.bannerImageMimeType = 1;
    } else if (typeof data.bannerImageUrl === "string" && data.bannerImageUrl.trim()) {
      setData.bannerImageUrl = data.bannerImageUrl.trim();
      delete setData.bannerImageData;
      delete setData.bannerImageMimeType;
      unsetData.bannerImageData = 1;
      unsetData.bannerImageMimeType = 1;
    }

    const updatePayload: Record<string, any> = {};
    if (Object.keys(setData).length > 0) {
      updatePayload.$set = setData;
    }
    if (Object.keys(unsetData).length > 0) {
      updatePayload.$unset = unsetData;
    }

    const story = await StoryModel.findOneAndUpdate(
      { _id: id, isDeleted: false },
      updatePayload,
      { new: true },
    ).select("+bannerImageData");

    if (!story) {
      return { success: false, errorType: "NOT_FOUND", message: "Story not found or unauthorized." };
    }

    return { success: true, data: normalizeStoryPayload(story) };
  } catch {
    return { success: false, errorType: "INTERNAL_ERROR", message: "Failed to update story." };
  }
}

export async function deleteStory(
  id: string,
  actor: UserBasicDetails,
): Promise<Result<void>> {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const story = await StoryModel.findOne({
        _id: id,
        isDeleted: false,
      })
        .session(session)
        .lean();

      if (!story) {
        throw new ServiceException("NOT_FOUND", "Story not found or unauthorized.");
      }
      if (!canManageStory(actor, story.author)) {
        throw new ServiceException("FORBIDDEN", "Story not found or unauthorized.");
      }

      await StoryModel.updateOne(
        { _id: id },
        { $set: { isDeleted: true, deletedAt: new Date(), status: "archived" } },
      ).session(session);

      const commentIds = await CommentModel.find(
        { storyId: new mongoose.Types.ObjectId(id), isDeleted: false },
        { _id: 1 },
      ).session(session);

      await CommentModel.updateMany(
        { storyId: new mongoose.Types.ObjectId(id), isDeleted: false },
        { $set: { isDeleted: true, deletedAt: new Date() } },
      ).session(session);

      await LikeModel.deleteMany({
        targetType: "Story",
        targetId: new mongoose.Types.ObjectId(id),
      }).session(session);

      await StoryViewModel.deleteMany({
        storyId: new mongoose.Types.ObjectId(id),
      }).session(session);

      if (commentIds.length > 0) {
        await LikeModel.deleteMany({
          targetType: "Comment",
          targetId: { $in: commentIds.map((item: any) => item._id) },
        }).session(session);
      }
    });

    return { success: true, data: undefined };
  } catch (error: unknown) {
    if (error instanceof ServiceException) {
      return { success: false, errorType: error.errorType, message: error.message };
    }
    return { success: false, errorType: "INTERNAL_ERROR", message: "Failed to delete story." };
  } finally {
    await session.endSession();
  }
}

export async function likeStory(
  storyId: string,
  userId: string,
): Promise<Result<any | null>> {
  const session = await mongoose.startSession();
  let resultData: any = null;
  try {
    await session.withTransaction(async () => {
      const story = await StoryModel.findOne({
        _id: storyId,
        status: "published",
        isDeleted: false,
      })
        .session(session)
        .lean();
        
      if (!story) {
        throw new ServiceException("NOT_FOUND", "Story not found.");
      }

      let isLiked = false;
      const existingLike = await LikeModel.findOne({
        targetId: storyId,
        userId,
        targetType: "Story"
      }).session(session);

      if (existingLike) {
        await LikeModel.deleteOne({ _id: existingLike._id }).session(session);
        await StoryModel.updateOne(
          { _id: storyId, likeCount: { $gt: 0 } },
          { $inc: { likeCount: -1 } }
        ).session(session);
        isLiked = false;
      } else {
        await LikeModel.create(
          [{ targetId: storyId, userId, targetType: "Story" }],
          { session }
        );
        await StoryModel.updateOne(
          { _id: storyId },
          { $inc: { likeCount: 1 } }
        ).session(session);
        isLiked = true;
      }

      const updatedStory = await StoryModel.findById(storyId)
        .select("+bannerImageData")
        .session(session)
        .lean();
        
      if (!updatedStory) {
        throw new ServiceException("NOT_FOUND", "Story not found after update.");
      }
      
      resultData = { ...normalizeStoryPayload(updatedStory), isLiked, authorId: String(story.author), title: story.title };
    });

    if (resultData?.isLiked && resultData.authorId && resultData.authorId !== userId) {
      const liker = await UserModel.findById(userId).lean();
      createNotification({
        recipient: resultData.authorId,
        sender: userId,
        type: "story_like",
        title: "New Like on your Story",
        message: `${liker?.name || "A volunteer"} liked your story "${resultData.title || "Volunteer Story"}".`,
        data: { storyId },
      });
    }

    const { authorId: _a, title: _t, ...cleanPayload } = resultData || {};
    return { success: true, data: cleanPayload };
  } catch (error: unknown) {
    if (error instanceof ServiceException) {
      return { success: false, errorType: error.errorType, message: error.message };
    }
    return { success: false, errorType: "INTERNAL_ERROR", message: "Failed to like story." };
  } finally {
    await session.endSession();
  }
}

export async function getStoryBySlug(
  slug: string,
  userId?: string,
): Promise<Result<any | null>> {
  try {
    const storyVisibilityQuery: Record<string, unknown> = {
      slug,
      isDeleted: false,
      status: "published",
    };
    
    if (userId) {
      storyVisibilityQuery.$or = [
        { status: "published" },
        { author: new mongoose.Types.ObjectId(userId) },
      ];
      delete storyVisibilityQuery.status;
    }

    const story = await StoryModel.findOne(storyVisibilityQuery)
      .select("+bannerImageData")
      .populate("author", "name")
      .lean();

    if (!story) {
      return { success: false, errorType: "NOT_FOUND", message: "Story not found." };
    }

    let isLiked = false;
    if (userId) {
      const userObjectId = new mongoose.Types.ObjectId(userId);
      const like = await LikeModel.findOne({
        targetId: story._id,
        userId: userObjectId,
        targetType: "Story",
      }).lean();
      isLiked = !!like;
    }

    const payload = { ...normalizeStoryPayload(story), isLiked };
    return { success: true, data: payload };
  } catch {
    return { success: false, errorType: "INTERNAL_ERROR", message: "Failed to fetch story by slug." };
  }
}

export async function recordStoryView(
  storyId: string,
  userId?: string,
): Promise<Result<void>> {
  try {
    const storyObjectId = new mongoose.Types.ObjectId(storyId);
    const story = await StoryModel.findOne(
      { _id: storyObjectId, status: "published", isDeleted: false },
      { _id: 1, slug: 1 },
    ).lean();

    if (!story) {
      return { success: false, errorType: "NOT_FOUND", message: "Story not found." };
    }

    if (!userId) {
      return { success: true, data: undefined };
    }

    try {
      await StoryViewModel.create({
        storyId: storyObjectId,
        userId: new mongoose.Types.ObjectId(userId),
      });
    } catch (error: unknown) {
      if (isDuplicateKeyError(error)) {
        return { success: true, data: undefined };
      }
      throw error;
    }

    await StoryModel.updateOne(
      { _id: storyObjectId },
      { $inc: { viewCount: 1 } },
    );

    return { success: true, data: undefined };
  } catch {
    return { success: false, errorType: "INTERNAL_ERROR", message: "Failed to record view." };
  }
}

export async function recordStoryRead(storyId: string, userId?: string): Promise<Result<void>> {
  try {
    const result = await StoryModel.findOneAndUpdate(
      { _id: storyId, status: "published", isDeleted: false },
      { $inc: { readCount: 1 } },
    );
    if (!result) {
      return { success: false, errorType: "NOT_FOUND", message: "Story not found." };
    }
    return { success: true, data: undefined };
  } catch {
    return { success: false, errorType: "INTERNAL_ERROR", message: "Failed to record read." };
  }
}