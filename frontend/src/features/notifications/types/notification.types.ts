/**
 * NOTIFICATION DOMAIN TYPES
 */

export type NotificationType =
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

export type NotificationFilter = "all" | "events" | "social" | "unread";

export interface NotificationSender {
  id: string;
  name: string;
  profileImageUrl: string | null;
}

export interface NotificationData {
  eventId?: string;
  storyId?: string;
  groupId?: string;
  commentId?: string;
  userId?: string;
  url?: string;
}

export interface NotificationItem {
  id: string;
  _id?: string;
  recipient: string;
  sender: NotificationSender | null;
  type: NotificationType;
  title: string;
  message: string;
  data: NotificationData;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: NotificationItem[];
  unreadCount: number;
  nextCursor: string | null;
}
