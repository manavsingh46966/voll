import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const likeSchema = new Schema(
  {
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      required: true,
      enum: ['Story', 'Comment'],
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

likeSchema.index({ targetId: 1, userId: 1, targetType: 1 }, { unique: true });
likeSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });

export const LikeModel = mongoose.model<Like>('Like', likeSchema);
export type Like = InferSchemaType<typeof likeSchema>;
