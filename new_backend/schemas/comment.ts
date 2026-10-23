import { z } from "zod";

export const CreateCommentSchema = z.object({
    content: z.string().trim().min(1).max(500),
    parentId: z.string().optional(),
});

export const UpdateCommentSchema = z.object({
    content: z.string().trim().min(1).max(500),
});

export type CreateComment = z.infer<typeof CreateCommentSchema>;
export type UpdateComment = z.infer<typeof UpdateCommentSchema>;
