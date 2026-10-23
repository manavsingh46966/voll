import { z } from "zod";
import { AccountStatuses, UserPermissions, UserRoles } from "../models/user.ts";

export const UserBasicDetailsSchema = z.object({
    id: z.string(),
    email: z.string(),
    role: z.enum(UserRoles),
    accountStatus: z.enum(AccountStatuses),
    permissions: z.array(z.enum(UserPermissions)).default([]),
    tokenVersion: z.number().int().min(0).default(0),
});

export type UserBasicDetails = z.infer<typeof UserBasicDetailsSchema>;
