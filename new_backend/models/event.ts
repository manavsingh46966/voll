import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const eventSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'An event must have a title'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    category: { type: String, trim: true },
    categoryIcon: { type: String, trim: true },
    coverPhotoUrl: { type: String, trim: true },
    locationType: {
      type: String,
      enum: ['physical', 'virtual', 'hybrid'],
      default: 'physical',
    },
    locationAddress: { type: Schema.Types.Mixed },
    locationCity: { type: String, trim: true },
    virtualLink: { type: String, trim: true },
    fromDateTime: { type: Date, required: [true, 'An event must have a start time'] },
    toDateTime: { type: Date, required: [true, 'An event must have an end time'] },
    lastDateToJoin: { type: Date },
    timeZone: { type: String, trim: true, default: 'Asia/Kolkata' },
    reqMinVolunteers: { type: Number, default: 0, min: 0 },
    numberOfVolunteers: { type: Number, default: 0, min: 0 },
    reqMaxVolunteers: { type: Number, default: 0, min: 0 },
    skillsRequired: { type: [String] },
    facilities: { type: [String] },
    tags: { type: [String] },
    visibility: {
      type: String,
      enum: ['public', 'private', 'groups_only', 'followers', 'byinvite'],
      default: 'public',
    },
    allowedGroups: [{ type: Schema.Types.ObjectId, ref: 'Group' }],
    allowJoiningRequests: { type: Boolean, default: false },
    allowMultipleSlots: { type: Boolean, default: false },
    isRecurring: { type: Boolean, default: false },
    recurrenceRule: { type: Schema.Types.Mixed },
    parentEventId: { type: Schema.Types.ObjectId, ref: 'Event', default: null },
    slots: [
      {
        slotId: { type: String, required: true },
        title: { type: String },
        startTime: { type: Date, required: true },
        endTime: { type: Date, required: true },
        maxParticipants: { type: Number, default: 0 },
        currentParticipants: { type: Number, default: 0 },
      },
    ],
    photos: { type: [String] },
    videos: { type: [String] },
    description: { type: String, trim: true },
    approvalNote: { type: String, trim: true },
    status: {
      type: String,
      enum: ['draft', 'pending_approval', 'published', 'cancelled', 'completed'],
      default: 'pending_approval',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'An event must belong to an organizer'],
      index: true,
    },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    approvedAt: { type: Date, default: null },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

eventSchema.index({ status: 1, isDeleted: 1, fromDateTime: -1 });
eventSchema.index({ createdBy: 1, status: 1, isDeleted: 1 });
eventSchema.index({ parentEventId: 1 });
eventSchema.index({ title: 'text', description: 'text', category: 'text' });
eventSchema.index(
  { deletedAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 30, partialFilterExpression: { isDeleted: true } },
);

export const EventModel = mongoose.model<Event>('Event', eventSchema);
export type Event = InferSchemaType<typeof eventSchema>;
