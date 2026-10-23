import express, { type RequestHandler } from "express";
import {
  broadcastEventAnnouncementController,
  deleteNotificationController,
  getNotificationsController,
  markAllAsReadController,
  markAsReadController,
} from "../controllers/notificationController.ts";
import { authHandler } from "../middleware/authMiddleware.ts";

export const notificationRouter = express.Router();

notificationRouter.use(authHandler as express.RequestHandler);

notificationRouter.get("/", getNotificationsController as RequestHandler);
notificationRouter.patch("/read-all", markAllAsReadController as RequestHandler);
notificationRouter.patch("/:id/read", markAsReadController as RequestHandler);
notificationRouter.delete("/:id", deleteNotificationController as RequestHandler);
notificationRouter.post("/events/:id/announcements", broadcastEventAnnouncementController as RequestHandler);

export default notificationRouter;
