import { z } from "zod";

const urlOrEmpty = z.string().url().or(z.literal(""));

export const CreateStorySchema = z.object({
    title: z.string().trim().min(1).max(120),
    bodyMarkdown: z.string().trim().min(10).max(5000),
    bannerImageUrl: urlOrEmpty.optional(),
    bannerImageData: z.string().max(2_000_000).optional(),
    bannerImageMimeType: z.string().trim().max(100).optional(),
    eventTimeframe: z.string().trim().max(60).optional(),
});

export const UpdateStorySchema = z.object({
    title: z.string().trim().min(1).max(120).optional(),
    bodyMarkdown: z.string().trim().min(10).max(5000).optional(),
    bannerImageUrl: urlOrEmpty.optional(),
    bannerImageData: z.string().max(2_000_000).optional(),
    bannerImageMimeType: z.string().trim().max(100).optional(),
    eventTimeframe: z.string().trim().max(60).optional(),
    status: z.enum(["draft", "pending_approval", "published", "archived"]).optional(),
});

export const AddCommentSchema = z.object({
    content: z.string().min(1).max(500),
});

export type CreateStory = z.infer<typeof CreateStorySchema>;
export type UpdateStory = z.infer<typeof UpdateStorySchema>;
export type AddComment = z.infer<typeof AddCommentSchema>;
