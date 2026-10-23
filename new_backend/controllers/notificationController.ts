import type { Response } from "express";
import { type AuthenticatedRequest } from "../types/express/authenticatedRequest.ts";
import {
  broadcastEventAnnouncementService,
  deleteNotificationService,
  getNotificationsService,
  markAllAsReadService,
  markAsReadService,
} from "../services/notification/notificationService.ts";
import { sendError } from "../utils/http.ts";

export async function getNotificationsController(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const filter = req.query.filter as "all" | "events" | "unread" | "social" | undefined;
  const cursor = req.query.cursor as string | undefined;
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

  const result = await getNotificationsService(req.user.id, filter, cursor, limit);
  if (result.success) {
    res.status(200).json({ success: true, data: result.data });
    return;
  }
  sendError(res, 500, result.errorType, result.message);
}

export async function markAsReadController(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const { id } = req.params;
  const result = await markAsReadService(req.user.id, id);
  if (result.success) {
    res.status(200).json({ success: true, data: result.data });
    return;
  }
  sendError(res, result.errorType === "NOT_FOUND" ? 404 : 500, result.errorType, result.message);
}

export async function markAllAsReadController(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const result = await markAllAsReadService(req.user.id);
  if (result.success) {
    res.status(200).json({ success: true, data: result.data });
    return;
  }
  sendError(res, 500, result.errorType, result.message);
}

export async function deleteNotificationController(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const { id } = req.params;
  const result = await deleteNotificationService(req.user.id, id);
  if (result.success) {
    res.status(200).json({ success: true, message: "Notification deleted." });
    return;
  }
  sendError(res, result.errorType === "NOT_FOUND" ? 404 : 500, result.errorType, result.message);
}

export async function broadcastEventAnnouncementController(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const { id: eventId } = req.params;
  const { title, message } = req.body;

  if (!message || typeof message !== "string" || !message.trim()) {
    sendError(res, 400, "BAD_REQUEST", "Announcement message is required.");
    return;
  }

  const result = await broadcastEventAnnouncementService(
    req.user.id,
    eventId,
    title || "Event Update",
    message.trim(),
  );

  if (result.success) {
    res.status(200).json({ success: true, data: result.data });
    return;
  }
  sendError(res, result.errorType === "FORBIDDEN" ? 403 : 500, result.errorType, result.message);
}
