import { z } from "zod";

export const CreateGroupSchema = z.object({
  name: z.string().min(1).max(80).trim(),
  description: z.string().max(500).trim().optional(),
  photoData: z.string().optional(),
  photoMimeType: z.string().optional(),
  initialMembers: z.array(z.string()).optional(),
});

export const UpdateGroupSchema = z.object({
  name: z.string().min(1).max(80).trim().optional(),
  description: z.string().max(500).trim().optional(),
  photoData: z.string().optional(),
  photoMimeType: z.string().optional(),
});

export const MemberActionSchema = z.object({
  userId: z.string().min(1),
});
