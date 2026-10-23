import mongoose, { Schema, type InferSchemaType } from "mongoose";

const storyViewSchema = new Schema(
    {
        storyId: {
            type: Schema.Types.ObjectId,
            ref: "Story",
            required: true,
            index: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
    },
    { timestamps: true },
);

storyViewSchema.index({ storyId: 1, userId: 1 }, { unique: true });
storyViewSchema.index({ storyId: 1, createdAt: -1 });

export const StoryViewModel = mongoose.model<StoryView>("StoryView", storyViewSchema);
export type StoryView = InferSchemaType<typeof storyViewSchema>;
