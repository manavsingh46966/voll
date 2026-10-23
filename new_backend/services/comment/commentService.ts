import mongoose from "mongoose";
import sanitizeHtml from "sanitize-html";
import { CommentModel } from "../../models/comment.ts";
import { LikeModel } from "../../models/like.ts";
import { StoryModel } from "../../models/story.ts";
import { UserModel } from "../../models/user.ts";
import { createNotification } from "../notification/notificationService.ts";
import { type CreateComment, type UpdateComment } from "../../schemas/comment.ts";
import { type Result, type ErrorType } from "../../types/common/result.ts";
import { violatesModeration } from "../../utils/moderation.ts";

class ServiceException extends Error {
  constructor(public errorType: ErrorType, message: string) {
    super(message);
    this.name = "ServiceException";
  }
}

const COMMENTS_PAGE_SIZE = 10;

function sanitizeComment(value: string) {
  return sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} }).trim();
}

export async function getComments(
  storyId: string,
  userId: string | undefined,
  cursor?: string,
  limit = COMMENTS_PAGE_SIZE,
): Promise<Result<any[]>> {
  try {
    const query: Record<string, any> = {
      storyId: new mongoose.Types.ObjectId(storyId),
      parentId: null,
      isDeleted: false,
    };

    if (cursor) {
      const cursorDate = new Date(cursor);
      if (Number.isNaN(cursorDate.getTime())) {
        return { success: false, errorType: "BAD_REQUEST", message: "Invalid cursor." };
      }
      query.createdAt = { $lt: cursorDate };
    }

    const comments = await CommentModel.find(query)
      .populate("userId", "name")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    let likedCommentIds = new Set<string>();
    if (userId && comments.length > 0) {
      const commentIds = comments.map((comment) => comment._id);
      const userObjectId = new mongoose.Types.ObjectId(userId);
      const userLikes = await LikeModel.find({
        targetId: { $in: commentIds },
        userId: userObjectId,
        targetType: "Comment",
      }).lean();
      userLikes.forEach((like) => likedCommentIds.add(like.targetId.toString()));
    }

    return {
      success: true,
      data: comments.map((comment) => ({
        ...comment,
        isLiked: likedCommentIds.has(comment._id.toString()),
      })),
    };
  } catch {
    return { success: false, errorType: "INTERNAL_ERROR", message: "Failed to fetch comments." };
  }
}

export async function getReplies(
  parentId: string,
  userId: string | undefined,
  cursor?: string,
  limit = COMMENTS_PAGE_SIZE,
): Promise<Result<any[]>> {
  try {
    const parent = await CommentModel.findOne({
      _id: parentId,
      parentId: null,
      isDeleted: false,
    }).lean();

    if (!parent) {
      return { success: false, errorType: "NOT_FOUND", message: "Parent comment not found or is itself a reply." };
    }

    const query: Record<string, any> = {
      parentId: new mongoose.Types.ObjectId(parentId),
      isDeleted: false,
    };

    if (cursor) {
      const cursorDate = new Date(cursor);
      if (Number.isNaN(cursorDate.getTime())) {
        return { success: false, errorType: "BAD_REQUEST", message: "Invalid cursor." };
      }
      query.createdAt = { $lt: cursorDate };
    }

    const replies = await CommentModel.find(query)
      .populate("userId", "name")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    let likedCommentIds = new Set<string>();
    if (userId && replies.length > 0) {
      const replyIds = replies.map((reply) => reply._id);
      const userObjectId = new mongoose.Types.ObjectId(userId);
      const userLikes = await LikeModel.find({
        targetId: { $in: replyIds },
        userId: userObjectId,
        targetType: "Comment",
      }).lean();
      userLikes.forEach((like) => likedCommentIds.add(like.targetId.toString()));
    }

    return {
      success: true,
      data: replies.map((reply) => ({
        ...reply,
        isLiked: likedCommentIds.has(reply._id.toString()),
      })),
    };
  } catch {
    return { success: false, errorType: "INTERNAL_ERROR", message: "Failed to fetch replies." };
  }
}

export async function createComment(
  storyId: string,
  userId: string,
  data: CreateComment,
): Promise<Result<any>> {
  const session = await mongoose.startSession();
  try {
    let created: any = null;
    const cleanContent = sanitizeComment(data.content);
    
    if (!cleanContent) {
      return { success: false, errorType: "BAD_REQUEST", message: "Invalid comment content." };
    }
    
    if (violatesModeration(cleanContent)) {
      return { success: false, errorType: "FORBIDDEN", message: "Content violates moderation policy." };
    }

    await session.withTransaction(async () => {
      const story = await StoryModel.findOne({
        _id: storyId,
        status: "published",
        isDeleted: false,
      }).session(session);

      if (!story) {
        throw new ServiceException("NOT_FOUND", "Story not found.");
      }

      if (data.parentId) {
        const parent = await CommentModel.findOne({
          _id: data.parentId,
          storyId: new mongoose.Types.ObjectId(storyId),
          parentId: null,
          isDeleted: false,
        }).session(session);
        if (!parent) {
          throw new ServiceException("BAD_REQUEST", "Parent comment not found or nesting depth exceeded.");
        }
      }

      const comment = await CommentModel.create(
        [
          {
            storyId: new mongoose.Types.ObjectId(storyId),
            userId: new mongoose.Types.ObjectId(userId),
            content: cleanContent,
            parentId: data.parentId ? new mongoose.Types.ObjectId(data.parentId) : null,
          },
        ],
        { session },
      );

      await StoryModel.updateOne(
        { _id: storyId },
        { $inc: { commentCount: 1 } },
      ).session(session);

      if (data.parentId) {
        await CommentModel.updateOne(
          { _id: data.parentId },
          { $inc: { replyCount: 1 } },
        ).session(session);
      }

      created = await CommentModel.findById(comment[0]._id)
        .populate("userId", "name")
        .session(session)
        .lean();
    });

    if (created) {
      const story = await StoryModel.findById(storyId).lean();
      const commenter = await UserModel.findById(userId).lean();
      const commenterName = commenter?.name || "A volunteer";

      // Notify story author (if not self)
      if (story && String(story.author) !== userId) {
        createNotification({
          recipient: String(story.author),
          sender: userId,
          type: "story_comment",
          title: "New Comment on your Story",
          message: `${commenterName} commented: "${cleanContent.substring(0, 50)}${cleanContent.length > 50 ? "..." : ""}"`,
          data: { storyId, commentId: String(created._id) },
        });
      }

      // If this is a reply, also notify the parent comment's author
      if (data.parentId) {
        const parent = await CommentModel.findById(data.parentId).lean();
        if (parent && String(parent.userId) !== userId && String(parent.userId) !== String(story?.author)) {
          createNotification({
            recipient: String(parent.userId),
            sender: userId,
            type: "story_comment",
            title: "New Reply to your Comment",
            message: `${commenterName} replied: "${cleanContent.substring(0, 50)}${cleanContent.length > 50 ? "..." : ""}"`,
            data: { storyId, commentId: String(created._id) },
          });
        }
      }
    }

    return { success: true, data: { ...created, isLiked: false } };
  } catch (error: unknown) {
    if (error instanceof ServiceException) {
      return { success: false, errorType: error.errorType, message: error.message };
    }
    return { success: false, errorType: "INTERNAL_ERROR", message: "Failed to create comment." };
  } finally {
    await session.endSession();
  }
}

export async function likeComment(
  commentId: string,
  userId: string,
): Promise<Result<{ likeCount: number; isLiked: boolean }>> {
  const session = await mongoose.startSession();
  try {
    let payload: { likeCount: number; isLiked: boolean } | null = null;

    await session.withTransaction(async () => {
      const comment = await CommentModel.findOne({
        _id: commentId,
        isDeleted: false,
      }).session(session);

      if (!comment) {
        throw new ServiceException("NOT_FOUND", "Comment not found.");
      }

      let isLiked = false;

      const existingLike = await LikeModel.findOne({
        targetId: commentId,
        userId,
        targetType: "Comment"
      }).session(session);

      if (existingLike) {
        await LikeModel.deleteOne({ _id: existingLike._id }).session(session);
        await CommentModel.updateOne(
          { _id: commentId, likeCount: { $gt: 0 } },
          { $inc: { likeCount: -1 } }
        ).session(session);
        isLiked = false;
      } else {
        await LikeModel.create(
          [{ targetId: commentId, userId, targetType: "Comment" }],
          { session }
        );
        await CommentModel.updateOne(
          { _id: commentId },
          { $inc: { likeCount: 1 } }
        ).session(session);
        isLiked = true;
      }

      const updated = await CommentModel.findById(commentId).session(session).lean();
      if (!updated) {
        throw new ServiceException("NOT_FOUND", "Comment not found after update.");
      }

      payload = { likeCount: (updated as any).likeCount, isLiked };
    });

    if (!payload) {
      return { success: false, errorType: "INTERNAL_ERROR", message: "Like toggle conflict." };
    }

    return { success: true, data: payload };
  } catch (error: unknown) {
    if (error instanceof ServiceException) {
      return { success: false, errorType: error.errorType, message: error.message };
    }
    return { success: false, errorType: "INTERNAL_ERROR", message: "Failed to toggle like on comment." };
  } finally {
    await session.endSession();
  }
}

export async function updateComment(
  commentId: string,
  userId: string,
  data: UpdateComment,
): Promise<Result<any>> {
  try {
    const cleanContent = sanitizeComment(data.content);
    if (!cleanContent) {
      return { success: false, errorType: "BAD_REQUEST", message: "Invalid comment content." };
    }
    
    if (violatesModeration(cleanContent)) {
      return { success: false, errorType: "FORBIDDEN", message: "Content violates moderation policy." };
    }

    const updated = await CommentModel.findOneAndUpdate(
      { _id: commentId, userId: new mongoose.Types.ObjectId(userId), isDeleted: false },
      { content: cleanContent },
      { new: true },
    )
      .populate("userId", "name")
      .lean();

    if (!updated) {
      const exists = await CommentModel.findOne({ _id: commentId, isDeleted: false }).lean();
      if (!exists) return { success: false, errorType: "NOT_FOUND", message: "Comment not found." };
      return { success: false, errorType: "FORBIDDEN", message: "Unauthorized comment edit." };
    }

    return { success: true, data: updated };
  } catch {
    return { success: false, errorType: "INTERNAL_ERROR", message: "Failed to update comment." };
  }
}

export async function deleteComment(
  commentId: string,
  userId: string,
): Promise<Result<void>> {
  const session = await mongoose.startSession();
  let affectedStoryId: string | null = null;
  try {
    await session.withTransaction(async () => {
      const comment = await CommentModel.findOne({
        _id: commentId,
        isDeleted: false,
      })
        .session(session)
        .lean();

      if (!comment) {
        throw new ServiceException("NOT_FOUND", "Comment not found.");
      }
      affectedStoryId = comment.storyId.toString();

      if (comment.userId.toString() !== userId) {
        throw new ServiceException("FORBIDDEN", "Unauthorized comment delete.");
      }

      await CommentModel.updateOne(
        { _id: commentId },
        { $set: { isDeleted: true, deletedAt: new Date() } },
      ).session(session);

      await LikeModel.deleteMany({
        targetType: "Comment",
        targetId: new mongoose.Types.ObjectId(commentId),
      }).session(session);

      await StoryModel.updateOne(
        { _id: comment.storyId, commentCount: { $gt: 0 } },
        { $inc: { commentCount: -1 } },
      ).session(session);

      if (comment.parentId) {
        await CommentModel.updateOne(
          { _id: comment.parentId, replyCount: { $gt: 0 } },
          { $inc: { replyCount: -1 } },
        ).session(session);
      } else {
        const childComments = await CommentModel.find(
          { parentId: new mongoose.Types.ObjectId(commentId), isDeleted: false },
          { _id: 1 },
        ).session(session);

        if (childComments.length > 0) {
          await CommentModel.updateMany(
            { parentId: new mongoose.Types.ObjectId(commentId), isDeleted: false },
            { $set: { isDeleted: true, deletedAt: new Date() } },
          ).session(session);

          await LikeModel.deleteMany({
            targetType: "Comment",
            targetId: { $in: childComments.map((item: any) => item._id) },
          }).session(session);

          await StoryModel.updateOne(
            { _id: comment.storyId, commentCount: { $gte: childComments.length } },
            { $inc: { commentCount: -childComments.length } },
          ).session(session);
        }
      }
    });

    return { success: true, data: undefined };
  } catch (error: unknown) {
    if (error instanceof ServiceException) {
      return { success: false, errorType: error.errorType, message: error.message };
    }
    return { success: false, errorType: "INTERNAL_ERROR", message: "Failed to delete comment." };
  } finally {
    await session.endSession();
  }
}