import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const eventRegistrationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    slotId: { type: String, default: null },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    status: {
      type: String,
      enum: ['joined', 'pending'],
      default: 'joined',
      index: true,
    },
  },
  { timestamps: true },
);

eventRegistrationSchema.index({ userId: 1, startTime: 1, endTime: 1 });
eventRegistrationSchema.index({ eventId: 1, status: 1 });
eventRegistrationSchema.index({ userId: 1, eventId: 1 }, { unique: true });

export const EventRegistrationModel = mongoose.model<EventRegistration>(
  'EventRegistration',
  eventRegistrationSchema,
);
export type EventRegistration = InferSchemaType<typeof eventRegistrationSchema>;
