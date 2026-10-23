import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const commentSchema = new Schema(
    {
        storyId: {
            type: Schema.Types.ObjectId,
            ref: 'Story',
            required: true,
            index: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        content: {
            type: String,
            required: true,
            trim: true,
            maxlength: [500, 'Comment cannot exceed 500 characters'],
        },
        /**
         * null  → top-level comment
         * ObjectId → direct reply to a top-level comment (max depth = 1)
         */
        parentId: {
            type: Schema.Types.ObjectId,
            ref: 'Comment',
            default: null,
            index: true,
        },
        likeCount: { type: Number, default: 0, min: 0 },
        replyCount: { type: Number, default: 0, min: 0 },
        isDeleted: { type: Boolean, default: false },
        deletedAt: { type: Date, default: null },
    },
    { timestamps: true },
);

commentSchema.index({ storyId: 1, parentId: 1, createdAt: -1 });
commentSchema.index({ deletedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30, partialFilterExpression: { isDeleted: true } });

export const CommentModel = mongoose.model<Comment>('Comment', commentSchema);
export type Comment = InferSchemaType<typeof commentSchema>;
