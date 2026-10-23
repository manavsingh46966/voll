import { z } from "zod";

export const CreateStorySchema = z.object({
  // The 'body' wrapper is standard practice so you can easily validate req.body
  body: z.object({
    title: z.string({ message: "A story must have a title" })
      .min(3, "Title must be at least 3 characters")
      .max(120, "Title cannot exceed 120 characters"),
      
    bodyMarkdown: z.string({ message: "Story content cannot be empty" })
      .min(10, "Story content must be at least 10 characters long"),
      
    bannerImageUrl: z.string()
      .url("Must be a valid URL")
      .optional()
      .nullable(),
      
    blurhash: z.string()
      .optional()
      .nullable(),
      
    eventTimeframe: z.string()
      .max(60, "Timeframe string is too long")
      .optional()
      .nullable(),
      
    status: z.enum(['draft', 'pending_approval', 'published', 'archived'])
      .optional()
      .default('draft'),
  })
});

// Export the inferred type so you get perfect auto-complete in your Express controllers
export type CreateStoryInput = z.infer<typeof CreateStorySchema>["body"];