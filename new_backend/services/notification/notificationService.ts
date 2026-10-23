import mongoose from "mongoose";
import { NotificationModel, type Notification } from "../../models/notification.ts";
import { EventModel } from "../../models/event.ts";
import { EventRegistrationModel } from "../../models/eventRegistration.ts";
import { UserModel } from "../../models/user.ts";
import { type Result } from "../../types/common/result.ts";

export interface CreateNotificationParams {
  recipient: string;
  sender?: string | null;
  type:
    | "event_join"
    | "event_update"
    | "event_reminder"
    | "event_announcement"
    | "event_message"
    | "event_cancelled"
    | "event_approved"
    | "story_like"
    | "story_comment"
    | "user_follow"
    | "group_invite"
    | "general";
  title: string;
  message: string;
  data?: {
    eventId?: string;
    storyId?: string;
    groupId?: string;
    commentId?: string;
    userId?: string;
    url?: string;
  };
}

/**
 * Creates a single notification in the database.
 * Silently catches errors so main actions (like, join, comment) don't fail if notification creation fails.
 */
export async function createNotification(
  params: CreateNotificationParams,
): Promise<Notification | null> {
  try {
    const { recipient, sender, type, title, message, data } = params;
    if (!recipient) return null;

    // Don't notify self
    if (sender && sender.toString() === recipient.toString()) {
      return null;
    }

    const payload: Record<string, any> = {
      recipient: new mongoose.Types.ObjectId(recipient),
      type,
      title,
      message,
    };

    if (sender) {
      payload.sender = new mongoose.Types.ObjectId(sender);
    }

    if (data) {
      const parsedData: Record<string, any> = {};
      if (data.eventId) parsedData.eventId = new mongoose.Types.ObjectId(data.eventId);
      if (data.storyId) parsedData.storyId = new mongoose.Types.ObjectId(data.storyId);
      if (data.groupId) parsedData.groupId = new mongoose.Types.ObjectId(data.groupId);
      if (data.commentId) parsedData.commentId = new mongoose.Types.ObjectId(data.commentId);
      if (data.userId) parsedData.userId = new mongoose.Types.ObjectId(data.userId);
      if (data.url) parsedData.url = data.url;
      payload.data = parsedData;
    }

    const notification = await NotificationModel.create(payload);
    return notification;
  } catch (error) {
    console.error("[NotificationService] createNotification error:", error);
    return null;
  }
}

/**
 * Fetches notifications for a user with unread count and filtering.
 */
export async function getNotificationsService(
  userId: string,
  filter?: "all" | "events" | "unread" | "social",
  cursor?: string,
  limit = 20,
): Promise<
  Result<{
    notifications: any[];
    unreadCount: number;
    nextCursor: string | null;
  }>
> {
  try {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const query: Record<string, any> = { recipient: userObjectId };

    if (filter === "unread") {
      query.isRead = false;
    } else if (filter === "events") {
      query.type = {
        $in: [
          "event_join",
          "event_update",
          "event_reminder",
          "event_announcement",
          "event_message",
          "event_cancelled",
          "event_approved",
        ],
      };
    } else if (filter === "social") {
      query.type = {
        $in: ["story_like", "story_comment", "user_follow", "group_invite"],
      };
    }

    if (cursor) {
      const cursorDate = new Date(cursor);
      if (!Number.isNaN(cursorDate.getTime())) {
        query.createdAt = { $lt: cursorDate };
      }
    }

    const [notifications, unreadCount] = await Promise.all([
      NotificationModel.find(query)
        .populate("sender", "name profileImageUrl email")
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean(),
      NotificationModel.countDocuments({ recipient: userObjectId, isRead: false }),
    ]);

    const formatted = notifications.map((n: any) => ({
      id: String(n._id),
      _id: String(n._id),
      recipient: String(n.recipient),
      sender: n.sender
        ? {
            id: String(n.sender._id),
            name: n.sender.name || "Volunteer",
            profileImageUrl: n.sender.profileImageUrl || null,
          }
        : null,
      type: n.type,
      title: n.title,
      message: n.message,
      data: n.data
        ? {
            eventId: n.data.eventId ? String(n.data.eventId) : undefined,
            storyId: n.data.storyId ? String(n.data.storyId) : undefined,
            groupId: n.data.groupId ? String(n.data.groupId) : undefined,
            commentId: n.data.commentId ? String(n.data.commentId) : undefined,
            userId: n.data.userId ? String(n.data.userId) : undefined,
            url: n.data.url,
          }
        : {},
      isRead: Boolean(n.isRead),
      readAt: n.readAt,
      createdAt: n.createdAt,
    }));

    const nextCursor =
      notifications.length === limit
        ? notifications[notifications.length - 1].createdAt.toISOString()
        : null;

    return {
      success: true,
      data: {
        notifications: formatted,
        unreadCount,
        nextCursor,
      },
    };
  } catch (error) {
    console.error("[NotificationService] getNotificationsService error:", error);
    return {
      success: false,
      errorType: "INTERNAL_ERROR",
      message: "Failed to fetch notifications.",
    };
  }
}

/**
 * Marks a single notification as read.
 */
export async function markAsReadService(
  userId: string,
  notificationId: string,
): Promise<Result<{ success: true }>> {
  try {
    const res = await NotificationModel.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(notificationId),
        recipient: new mongoose.Types.ObjectId(userId),
      },
      {
        $set: { isRead: true, readAt: new Date() },
      },
    );

    if (!res) {
      return { success: false, errorType: "NOT_FOUND", message: "Notification not found." };
    }

    return { success: true, data: { success: true } };
  } catch (error) {
    return { success: false, errorType: "INTERNAL_ERROR", message: "Failed to update notification." };
  }
}

/**
 * Marks all notifications for a user as read.
 */
export async function markAllAsReadService(
  userId: string,
): Promise<Result<{ modifiedCount: number }>> {
  try {
    const res = await NotificationModel.updateMany(
      { recipient: new mongoose.Types.ObjectId(userId), isRead: false },
      { $set: { isRead: true, readAt: new Date() } },
    );

    return { success: true, data: { modifiedCount: res.modifiedCount } };
  } catch (error) {
    return { success: false, errorType: "INTERNAL_ERROR", message: "Failed to mark all as read." };
  }
}

/**
 * Deletes a single notification.
 */
export async function deleteNotificationService(
  userId: string,
  notificationId: string,
): Promise<Result<void>> {
  try {
    const res = await NotificationModel.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(notificationId),
      recipient: new mongoose.Types.ObjectId(userId),
    });

    if (!res) {
      return { success: false, errorType: "NOT_FOUND", message: "Notification not found." };
    }

    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, errorType: "INTERNAL_ERROR", message: "Failed to delete notification." };
  }
}

/**
 * Allows event organizer to broadcast an announcement to all joined attendees of an event.
 */
export async function broadcastEventAnnouncementService(
  organizerId: string,
  eventId: string,
  title: string,
  message: string,
): Promise<Result<{ notifiedCount: number }>> {
  try {
    const event = await EventModel.findOne({
      _id: new mongoose.Types.ObjectId(eventId),
      createdBy: new mongoose.Types.ObjectId(organizerId),
      isDeleted: false,
    }).lean();

    if (!event) {
      return { success: false, errorType: "FORBIDDEN", message: "Event not found or unauthorized." };
    }

    const registrations = await EventRegistrationModel.find({
      eventId: new mongoose.Types.ObjectId(eventId),
      status: "joined",
    }).lean();

    const notificationsToInsert = registrations
      .filter((r) => r.userId.toString() !== organizerId)
      .map((r) => ({
        recipient: r.userId,
        sender: new mongoose.Types.ObjectId(organizerId),
        type: "event_announcement",
        title: title || `Update from ${event.title}`,
        message,
        data: {
          eventId: event._id,
        },
        isRead: false,
      }));

    if (notificationsToInsert.length > 0) {
      await NotificationModel.insertMany(notificationsToInsert);
    }

    return { success: true, data: { notifiedCount: notificationsToInsert.length } };
  } catch (error) {
    console.error("[NotificationService] broadcastEventAnnouncementService error:", error);
    return { success: false, errorType: "INTERNAL_ERROR", message: "Failed to broadcast announcement." };
  }
}
