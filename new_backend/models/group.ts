import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const groupSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, trim: true, maxlength: 500, default: '' },
    photoData: { type: String, select: false },
    photoMimeType: { type: String },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    admins: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

groupSchema.index({ author: 1, isDeleted: 1 });
groupSchema.index({ admins: 1, isDeleted: 1 });
groupSchema.index({ members: 1, isDeleted: 1 });

export const GroupModel = mongoose.model<Group>('Group', groupSchema);
export type Group = InferSchemaType<typeof groupSchema>;
