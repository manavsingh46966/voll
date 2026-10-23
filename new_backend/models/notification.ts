import mongoose, { Schema, type InferSchemaType } from "mongoose";

export const NotificationTypes = [
  "event_join",
  "event_update",
  "event_reminder",
  "event_announcement",
  "event_message",
  "event_cancelled",
  "event_approved",
  "story_like",
  "story_comment",
  "user_follow",
  "group_invite",
  "general",
] as const;

const notificationSchema = new Schema(
  {
    recipient: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    sender: { type: Schema.Types.ObjectId, ref: "User", default: null },
    type: {
      type: String,
      enum: NotificationTypes,
      default: "general",
      index: true,
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    data: {
      eventId: { type: Schema.Types.ObjectId, ref: "Event" },
      storyId: { type: Schema.Types.ObjectId, ref: "Story" },
      groupId: { type: Schema.Types.ObjectId, ref: "Group" },
      commentId: { type: Schema.Types.ObjectId, ref: "Comment" },
      userId: { type: Schema.Types.ObjectId, ref: "User" },
      url: { type: String },
    },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date, default: null },
  },
  { timestamps: true },
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

export const NotificationModel = mongoose.model<Notification>("Notification", notificationSchema);
export type Notification = InferSchemaType<typeof notificationSchema>;
