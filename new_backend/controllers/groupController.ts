import type { Request, Response } from "express";
import {
  CreateGroupSchema,
  MemberActionSchema,
  UpdateGroupSchema,
} from "../schemas/group.ts";
import {
  addMember,
  createGroup,
  deleteGroup,
  getAvailableUsers,
  getGroupById,
  getGroupPhoto,
  getGroups,
  removeMember,
  updateGroup,
  promoteToAdmin,
  demoteAdmin,
} from "../services/group/groupService.ts";
import { sendError, sendResult } from "../utils/http.ts";
import { catchAsync } from "../utils/catchAsync.ts";

export const getGroupsHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await getGroups(req.user!);
  sendResult(res, result);
});

export const getGroupByIdHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await getGroupById(req.params.id, req.user!);
  sendResult(res, result);
});

export const getGroupPhotoHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await getGroupPhoto(req.params.id);
  
  if (!result.success || !result.data) {
    sendError(res, 404, "NOT_FOUND", "Photo not found");
    return;
  }
  
  const buffer = Buffer.from(result.data.data, "base64");
  res.setHeader("Content-Type", result.data.mimeType);
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  res.setHeader("Content-Length", String(buffer.length));
  res.status(200).end(buffer);
});

export const createGroupHandler = catchAsync(async (req: Request, res: Response) => {
  const parsed = CreateGroupSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 400, "BAD_REQUEST", "Validation failed", parsed.error.flatten());
    return;
  }
  
  const result = await createGroup(req.user!.id, parsed.data);
  sendResult(res, result, 201);
});

export const updateGroupHandler = catchAsync(async (req: Request, res: Response) => {
  const parsed = UpdateGroupSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 400, "BAD_REQUEST", "Validation failed", parsed.error.flatten());
    return;
  }
  
  const result = await updateGroup(req.params.id, req.user!, parsed.data);
  sendResult(res, result);
});

export const deleteGroupHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await deleteGroup(req.params.id, req.user!);
  
  if (result.success) {
    res.status(204).send();
  } else {
    sendResult(res, result);
  }
});

export const addMemberHandler = catchAsync(async (req: Request, res: Response) => {
  const parsed = MemberActionSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 400, "BAD_REQUEST", "Validation failed", parsed.error.flatten());
    return;
  }
  
  const result = await addMember(req.params.id, req.user!, parsed.data.userId);
  sendResult(res, result);
});

export const removeMemberHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await removeMember(req.params.id, req.user!, req.params.userId);
  sendResult(res, result);
});

export const getAvailableUsersHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await getAvailableUsers(req.user!.id);
  sendResult(res, result);
});

export const promoteToAdminHandler = catchAsync(async (req: Request, res: Response) => {
  const { userId: targetUserId } = req.body;
  if (!targetUserId) {
    sendError(res, 400, "BAD_REQUEST", "Target user ID is required");
    return;
  }
  
  const result = await promoteToAdmin(req.params.id, req.user!, targetUserId);
  sendResult(res, result);
});

export const demoteAdminHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await demoteAdmin(req.params.id, req.user!, req.params.userId);
  sendResult(res, result);
});