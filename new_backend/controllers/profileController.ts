import type { Response } from "express";
import { type AuthenticatedRequest } from "../types/express/authenticatedRequest.ts";
import {
  followUserService,
  getFollowersService,
  getFollowingService,
  getMyProfileService,
  getUserProfileService,
  searchUsersService,
  unfollowUserService,
  updateMyProfileService,
  updateProfilePhotoService,
} from "../services/user/profileService.ts";
import { sendError } from "../utils/http.ts";

export async function getMyProfileController(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const result = await getMyProfileService(req.user.id);
  if (result.success) {
    res.status(200).json({ success: true, data: result.data });
    return;
  }
  sendError(res, result.errorType === "NOT_FOUND" ? 404 : 500, result.errorType, result.message);
}

export async function getUserProfileController(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const { userId } = req.params;
  const viewerId = req.user?.id;
  const result = await getUserProfileService(viewerId, userId);
  if (result.success) {
    res.status(200).json({ success: true, data: result.data });
    return;
  }
  sendError(res, result.errorType === "NOT_FOUND" ? 404 : 400, result.errorType, result.message);
}

export async function updateMyProfileController(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const result = await updateMyProfileService(req.user.id, req.body);
  if (result.success) {
    res.status(200).json({ success: true, data: result.data });
    return;
  }
  sendError(res, 400, result.errorType, result.message);
}

export async function updateProfilePhotoController(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const { profileImageUrl } = req.body;
  const result = await updateProfilePhotoService(req.user.id, profileImageUrl ?? null);
  if (result.success) {
    res.status(200).json({ success: true, data: result.data });
    return;
  }
  sendError(res, 400, result.errorType, result.message);
}

export async function followUserController(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const { userId } = req.params;
  const result = await followUserService(req.user.id, userId);
  if (result.success) {
    res.status(200).json({ success: true, data: result.data });
    return;
  }
  sendError(res, result.errorType === "NOT_FOUND" ? 404 : 400, result.errorType, result.message);
}

export async function unfollowUserController(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const { userId } = req.params;
  const result = await unfollowUserService(req.user.id, userId);
  if (result.success) {
    res.status(200).json({ success: true, data: result.data });
    return;
  }
  sendError(res, 400, result.errorType, result.message);
}

export async function getFollowersController(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const { userId } = req.params;
  const cursor = req.query.cursor as string | undefined;
  const result = await getFollowersService(req.user?.id, userId, cursor);
  if (result.success) {
    res.status(200).json({ success: true, data: result.data });
    return;
  }
  sendError(res, 400, result.errorType, result.message);
}

export async function getFollowingController(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const { userId } = req.params;
  const cursor = req.query.cursor as string | undefined;
  const result = await getFollowingService(req.user?.id, userId, cursor);
  if (result.success) {
    res.status(200).json({ success: true, data: result.data });
    return;
  }
  sendError(res, 400, result.errorType, result.message);
}

export async function searchUsersController(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const q = (req.query.q as string) || "";
  const cursor = req.query.cursor as string | undefined;
  const result = await searchUsersService(req.user?.id, q, cursor);
  if (result.success) {
    res.status(200).json({ success: true, data: result.data });
    return;
  }
  sendError(res, 400, result.errorType, result.message);
}
