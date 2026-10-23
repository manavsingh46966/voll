import mongoose from "mongoose";
import { GroupModel } from "../../models/group.ts";
import { UserModel } from "../../models/user.ts";
import type { Result, ErrorType } from "../../types/common/result.ts";
import type { UserBasicDetails } from "../../schemas/userBasicDetails.ts";

class ServiceException extends Error {
  constructor(public errorType: ErrorType, message: string) {
    super(message);
    this.name = "ServiceException";
  }
}

const ALLOWED_IMAGE_MIMES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function canManageGroup(actor: UserBasicDetails, group: { author?: unknown; admins?: unknown[] }): boolean {
  if (actor.role === "superadmin") return true;
  if (actor.permissions.includes("group:manage:any")) return true;
  if (String(group.author) === actor.id) return true;
  if (Array.isArray(group.admins) && group.admins.some((a) => String(a) === actor.id)) return true;
  return false;
}

function canViewGroup(actor: UserBasicDetails, group: { author?: unknown; admins?: unknown[]; members?: unknown[] }): boolean {
  if (canManageGroup(actor, group)) return true;
  return Array.isArray(group.members) && group.members.some((member) => String(member) === actor.id);
}

function normalizeGroup(doc: any) {
  const raw = typeof doc?.toObject === "function" ? doc.toObject() : doc;
  return {
    id: String(raw._id),
    name: raw.name,
    description: raw.description ?? "",
    photoMimeType: raw.photoMimeType ?? null,
    hasPhoto: !!(raw.photoData || raw.photoMimeType),
    author: raw.author
      ? { id: String(raw.author._id ?? raw.author), name: raw.author.name ?? null }
      : null,
    admins: Array.isArray(raw.admins)
      ? raw.admins.map((a: any) => ({
          id: String(a._id ?? a),
          name: a.name ?? null,
          email: a.email ?? null,
        }))
      : [],
    members: Array.isArray(raw.members)
      ? raw.members.map((m: any) => ({
          id: String(m._id ?? m),
          name: m.name ?? null,
          email: m.email ?? null,
        }))
      : [],
    memberCount: Array.isArray(raw.members) ? raw.members.length : 0,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export async function createGroup(
  authorId: string,
  data: {
    name: string;
    description?: string;
    photoData?: string;
    photoMimeType?: string;
    initialMembers?: string[];
  },
): Promise<Result<any>> {
  try {
    if (data.photoData && data.photoMimeType) {
      if (!ALLOWED_IMAGE_MIMES.includes(data.photoMimeType.trim())) {
        return { success: false, errorType: "BAD_REQUEST", message: "Invalid image format." };
      }
    }

    const memberIds = Array.isArray(data.initialMembers)
      ? data.initialMembers
          .filter((id) => mongoose.isValidObjectId(id))
          .map((id) => new mongoose.Types.ObjectId(id))
      : [];

    const authorOid = new mongoose.Types.ObjectId(authorId);
    const group = await GroupModel.create({
      name: data.name,
      description: data.description ?? "",
      photoData: data.photoData,
      photoMimeType: data.photoMimeType?.trim(),
      author: authorOid,
      admins: [authorOid],
      members: memberIds,
    });

    const populated = await GroupModel.findById(group._id).populate("author", "name email").populate("admins", "name email").lean();
    return { success: true, data: normalizeGroup(populated) };
  } catch (error: unknown) {
    if (error instanceof ServiceException) {
      return { success: false, errorType: error.errorType, message: error.message };
    }
    return { success: false, errorType: "INTERNAL_ERROR", message: "Failed to create group." };
  }
}

export async function getGroups(actor: UserBasicDetails): Promise<Result<any[]>> {
  try {
    const uid = new mongoose.Types.ObjectId(actor.id);
    const filter = actor.role === "superadmin" || actor.permissions.includes("group:manage:any")
      ? { isDeleted: false }
      : { isDeleted: false, $or: [{ author: uid }, { members: uid }] };
      
    const groups = await GroupModel.find(filter)
      .populate("author", "name email")
      .populate("admins", "name email")
      .populate("members", "name email")
      .sort({ createdAt: -1 })
      .lean();

    return { success: true, data: groups.map(normalizeGroup) };
  } catch (error: unknown) {
    if (error instanceof ServiceException) {
      return { success: false, errorType: error.errorType, message: error.message };
    }
    return { success: false, errorType: "INTERNAL_ERROR", message: "Failed to fetch groups." };
  }
}

export async function getGroupById(groupId: string, actor: UserBasicDetails): Promise<Result<any>> {
  try {
    if (!mongoose.isValidObjectId(groupId)) {
      return { success: false, errorType: "BAD_REQUEST", message: "Invalid group ID." };
    }
    const group = await GroupModel.findOne({ _id: groupId, isDeleted: false })
      .populate("author", "name email")
      .populate("admins", "name email")
      .populate("members", "name email")
      .lean();

    if (!group) return { success: false, errorType: "NOT_FOUND", message: "Group not found." };
    if (!canViewGroup(actor, group)) {
      return { success: false, errorType: "FORBIDDEN", message: "Group not found or unauthorized." };
    }
    return { success: true, data: normalizeGroup(group) };
  } catch (error: unknown) {
    if (error instanceof ServiceException) {
      return { success: false, errorType: error.errorType, message: error.message };
    }
    return { success: false, errorType: "INTERNAL_ERROR", message: "Failed to fetch group." };
  }
}

export async function getGroupPhoto(groupId: string): Promise<Result<{ data: string; mimeType: string }>> {
  try {
    if (!mongoose.isValidObjectId(groupId)) {
      return { success: false, errorType: "BAD_REQUEST", message: "Invalid group ID." };
    }
    const group = await GroupModel.findOne({ _id: groupId, isDeleted: false })
      .select("+photoData photoMimeType")
      .lean();

    if (!group || !group.photoData) {
      return { success: false, errorType: "NOT_FOUND", message: "Photo not found." };
    }
    return { success: true, data: { data: group.photoData, mimeType: group.photoMimeType ?? "image/jpeg" } };
  } catch (error: unknown) {
    if (error instanceof ServiceException) {
      return { success: false, errorType: error.errorType, message: error.message };
    }
    return { success: false, errorType: "INTERNAL_ERROR", message: "Failed to fetch group photo." };
  }
}

export async function updateGroup(
  groupId: string,
  actor: UserBasicDetails,
  data: { name?: string; description?: string; photoData?: string; photoMimeType?: string },
): Promise<Result<any>> {
  try {
    if (!mongoose.isValidObjectId(groupId)) {
      return { success: false, errorType: "BAD_REQUEST", message: "Invalid group ID." };
    }
    
    if (data.photoData && data.photoMimeType) {
      if (!ALLOWED_IMAGE_MIMES.includes(data.photoMimeType.trim())) {
        return { success: false, errorType: "BAD_REQUEST", message: "Invalid image format." };
      }
      data.photoMimeType = data.photoMimeType.trim();
    }

    const existing = await GroupModel.findOne({ _id: groupId, isDeleted: false }).lean();
    if (!existing) {
      return { success: false, errorType: "NOT_FOUND", message: "Group not found." };
    }
    if (!canManageGroup(actor, existing)) {
      return { success: false, errorType: "FORBIDDEN", message: "Unauthorized to update this group." };
    }
    
    const group = await GroupModel.findOneAndUpdate(
      { _id: groupId, isDeleted: false },
      { $set: data },
      { new: true },
    )
      .populate("author", "name email")
      .populate("admins", "name email")
      .populate("members", "name email")
      .lean();

    if (!group) return { success: false, errorType: "NOT_FOUND", message: "Group not found." };
    return { success: true, data: normalizeGroup(group) };
  } catch (error: unknown) {
    if (error instanceof ServiceException) {
      return { success: false, errorType: error.errorType, message: error.message };
    }
    return { success: false, errorType: "INTERNAL_ERROR", message: "Failed to update group." };
  }
}

export async function deleteGroup(groupId: string, actor: UserBasicDetails): Promise<Result<void>> {
  try {
    if (!mongoose.isValidObjectId(groupId)) {
      return { success: false, errorType: "BAD_REQUEST", message: "Invalid group ID." };
    }
    const existing = await GroupModel.findOne({ _id: groupId, isDeleted: false }).lean();
    if (!existing) {
      return { success: false, errorType: "NOT_FOUND", message: "Group not found." };
    }
    if (!canManageGroup(actor, existing)) {
      return { success: false, errorType: "FORBIDDEN", message: "Unauthorized to delete this group." };
    }
    
    const result = await GroupModel.findOneAndUpdate(
      { _id: groupId, isDeleted: false },
      { $set: { isDeleted: true } },
    );
    if (!result) return { success: false, errorType: "NOT_FOUND", message: "Group not found." };
    return { success: true, data: undefined };
  } catch (error: unknown) {
    if (error instanceof ServiceException) {
      return { success: false, errorType: error.errorType, message: error.message };
    }
    return { success: false, errorType: "INTERNAL_ERROR", message: "Failed to delete group." };
  }
}

export async function addMember(groupId: string, actor: UserBasicDetails, targetUserId: string): Promise<Result<any>> {
  try {
    if (!mongoose.isValidObjectId(groupId) || !mongoose.isValidObjectId(targetUserId)) {
      return { success: false, errorType: "BAD_REQUEST", message: "Invalid ID." };
    }
    const existing = await GroupModel.findOne({ _id: groupId, isDeleted: false }).lean();
    if (!existing) {
      return { success: false, errorType: "NOT_FOUND", message: "Group not found." };
    }
    if (!canManageGroup(actor, existing)) {
      return { success: false, errorType: "FORBIDDEN", message: "Unauthorized to add members." };
    }
    
    const group = await GroupModel.findOneAndUpdate(
      { _id: groupId, isDeleted: false },
      { $addToSet: { members: new mongoose.Types.ObjectId(targetUserId) } },
      { new: true },
    )
      .populate("author", "name email")
      .populate("admins", "name email")
      .populate("members", "name email")
      .lean();

    if (!group) return { success: false, errorType: "NOT_FOUND", message: "Group not found." };
    return { success: true, data: normalizeGroup(group) };
  } catch (error: unknown) {
    if (error instanceof ServiceException) {
      return { success: false, errorType: error.errorType, message: error.message };
    }
    return { success: false, errorType: "INTERNAL_ERROR", message: "Failed to add member." };
  }
}

export async function removeMember(groupId: string, actor: UserBasicDetails, targetUserId: string): Promise<Result<any>> {
  try {
    if (!mongoose.isValidObjectId(groupId) || !mongoose.isValidObjectId(targetUserId)) {
      return { success: false, errorType: "BAD_REQUEST", message: "Invalid ID." };
    }
    
    const existing = await GroupModel.findOne({ _id: groupId, isDeleted: false }).lean();
    if (!existing) {
      return { success: false, errorType: "NOT_FOUND", message: "Group not found." };
    }
    if (!canManageGroup(actor, existing)) {
      return { success: false, errorType: "FORBIDDEN", message: "Unauthorized to remove members." };
    }
    if (String(existing.author) === targetUserId) {
      return { success: false, errorType: "FORBIDDEN", message: "Cannot remove the group creator." };
    }
    
    const group = await GroupModel.findOneAndUpdate(
      { _id: groupId, isDeleted: false },
      { $pull: { members: new mongoose.Types.ObjectId(targetUserId) } },
      { new: true },
    )
      .populate("author", "name email")
      .populate("admins", "name email")
      .populate("members", "name email")
      .lean();

    if (!group) return { success: false, errorType: "NOT_FOUND", message: "Group not found." };
    return { success: true, data: normalizeGroup(group) };
  } catch (error: unknown) {
    if (error instanceof ServiceException) {
      return { success: false, errorType: error.errorType, message: error.message };
    }
    return { success: false, errorType: "INTERNAL_ERROR", message: "Failed to remove member." };
  }
}

export async function getAvailableUsers(excludeUserId: string): Promise<Result<any[]>> {
  try {
    const users = await UserModel.find({ 
      _id: { $ne: new mongoose.Types.ObjectId(excludeUserId) },
      isDeleted: false
    })
      .select("name email")
      .limit(100)
      .lean();

    return {
      success: true,
      data: users.map((u) => ({
        id: String(u._id),
        name: u.name ?? null,
        email: u.email,
      })),
    };
  } catch (error: unknown) {
    if (error instanceof ServiceException) {
      return { success: false, errorType: error.errorType, message: error.message };
    }
    return { success: false, errorType: "INTERNAL_ERROR", message: "Failed to fetch available users." };
  }
}

export async function promoteToAdmin(groupId: string, actor: UserBasicDetails, targetUserId: string): Promise<Result<any>> {
  try {
    if (!mongoose.isValidObjectId(groupId) || !mongoose.isValidObjectId(targetUserId)) {
      return { success: false, errorType: "BAD_REQUEST", message: "Invalid ID." };
    }
    
    const existing = await GroupModel.findOne({ _id: groupId, isDeleted: false }).lean();
    if (!existing) {
      return { success: false, errorType: "NOT_FOUND", message: "Group not found." };
    }
    if (!canManageGroup(actor, existing)) {
      return { success: false, errorType: "FORBIDDEN", message: "Unauthorized to manage this group." };
    }
    if (String(existing.author) !== actor.id && actor.role !== 'superadmin') {
      return { success: false, errorType: "FORBIDDEN", message: "Only the group creator can promote admins." };
    }
    
    const targetOid = new mongoose.Types.ObjectId(targetUserId);
    const group = await GroupModel.findOneAndUpdate(
      { _id: groupId, isDeleted: false },
      { $addToSet: { admins: targetOid } },
      { new: true },
    )
      .populate("author", "name email")
      .populate("admins", "name email")
      .populate("members", "name email")
      .lean();
      
    if (!group) return { success: false, errorType: "NOT_FOUND", message: "Group not found." };
    return { success: true, data: normalizeGroup(group) };
  } catch (error: unknown) {
    if (error instanceof ServiceException) {
      return { success: false, errorType: error.errorType, message: error.message };
    }
    return { success: false, errorType: "INTERNAL_ERROR", message: "Failed to promote admin." };
  }
}

export async function demoteAdmin(groupId: string, actor: UserBasicDetails, targetUserId: string): Promise<Result<any>> {
  try {
    if (!mongoose.isValidObjectId(groupId) || !mongoose.isValidObjectId(targetUserId)) {
      return { success: false, errorType: "BAD_REQUEST", message: "Invalid ID." };
    }
    
    const existing = await GroupModel.findOne({ _id: groupId, isDeleted: false }).lean();
    if (!existing) {
      return { success: false, errorType: "NOT_FOUND", message: "Group not found." };
    }
    if (String(existing.author) !== actor.id && actor.role !== 'superadmin') {
      return { success: false, errorType: "FORBIDDEN", message: "Only the group creator can demote admins." };
    }
    if (String(existing.author) === targetUserId) {
      return { success: false, errorType: "FORBIDDEN", message: "Cannot demote the group creator." };
    }
    
    const targetOid = new mongoose.Types.ObjectId(targetUserId);
    const group = await GroupModel.findOneAndUpdate(
      { _id: groupId, isDeleted: false },
      { $pull: { admins: targetOid } },
      { new: true },
    )
      .populate("author", "name email")
      .populate("admins", "name email")
      .populate("members", "name email")
      .lean();
      
    if (!group) return { success: false, errorType: "NOT_FOUND", message: "Group not found." };
    return { success: true, data: normalizeGroup(group) };
  } catch (error: unknown) {
    if (error instanceof ServiceException) {
      return { success: false, errorType: error.errorType, message: error.message };
    }
    return { success: false, errorType: "INTERNAL_ERROR", message: "Failed to demote admin." };
  }
}