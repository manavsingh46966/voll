import { z } from "zod";

export const ObjectIdSchema = z
  .string()
  .regex(/^[a-fA-F0-9]{24}$/, "Invalid id");

export const CursorSchema = z
  .string()
  .datetime({ offset: true })
  .optional();

export const PaginationQuerySchema = z.object({
  cursor: CursorSchema,
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

export const StoriesQuerySchema = PaginationQuerySchema.extend({
  authorId: ObjectIdSchema.or(z.literal("me")).optional(),
});
