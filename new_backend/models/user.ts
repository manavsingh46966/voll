import mongoose, { Schema, type InferSchemaType } from "mongoose";

export const UserRoles = ["superadmin", "user"] as const;
export const AccountStatuses = ["active", "suspended", "deleted"] as const;
export const UserPermissions = [
    "event:create",
    "event:approve",
    "event:manage:any",
    "story:approve",
    "story:manage:any",
    "group:manage:any",
    "user:manage",
] as const;

const userSchema = new Schema({
    email: { type: String, required: true, unique: true, index: true },
    phoneNumber: { type: String, required: false, default: "" },
    role: { type: String, enum: UserRoles, default: "user", index: true },
    accountStatus: { type: String, enum: AccountStatuses, default: "active", index: true },
    permissions: { type: [String], enum: UserPermissions, default: [] },
    tokenVersion: { type: Number, default: 0 },
    name: { type: String, default: "" },
    bio: { type: String, default: "" },
    profileImageUrl: { type: String, default: null },
    dateOfBirth: { type: Date },
    gender: { type: String, default: "" },
    city: { type: String, default: "" },
    website: { type: String, default: "" },
    interests: { type: [String], default: [] },
    skillsets: { type: [String], default: [] },
    showMobileNumber: { type: Boolean, default: true },
    showEmail: { type: Boolean, default: true },
    showWebsite: { type: Boolean, default: true },
    followersCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
}, { timestamps: true });

export const UserModel = mongoose.model<User>("User", userSchema);
export type User = InferSchemaType<typeof userSchema>;
export type UserRole = (typeof UserRoles)[number];
export type AccountStatus = (typeof AccountStatuses)[number];
export type UserPermission = (typeof UserPermissions)[number];
