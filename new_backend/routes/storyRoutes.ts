import { Router } from "express";
import {
  createStoryHandler,
  deleteStoryHandler,
  getStoriesHandler,
  getStoryByIdHandler,
  getStoryBySlugHandler,
  likeStoryHandler,
  recordStoryReadHandler,
  recordStoryViewHandler,
  updateStoryHandler,
} from "../controllers/storyController.ts";
import { createCommentHandler, getCommentsHandler } from "../controllers/commentController.ts";
import { authHandler, optionalAuthHandler } from "../middleware/authMiddleware.ts";
import { createRateLimit } from "../middleware/rateLimit.ts";

const router = Router();

const storyReadLimiter = createRateLimit({ windowMs: 60_000, max: 120, scope: "ip" });
const storyWriteLimiter = createRateLimit({ windowMs: 60_000, max: 30, scope: "user_or_ip" });

router.get("/", optionalAuthHandler, storyReadLimiter, getStoriesHandler);
router.get("/article/:slug", optionalAuthHandler, storyReadLimiter, getStoryBySlugHandler);
router.get("/:id", optionalAuthHandler, storyReadLimiter, getStoryByIdHandler);
router.get("/:id/comments", optionalAuthHandler, storyReadLimiter, getCommentsHandler);
router.post("/:id/record-view", optionalAuthHandler, storyWriteLimiter, recordStoryViewHandler);
router.post("/:id/record-read", optionalAuthHandler, storyWriteLimiter, recordStoryReadHandler);
router.post("/", authHandler, storyWriteLimiter, createStoryHandler);
router.put("/:id", authHandler, storyWriteLimiter, updateStoryHandler);
router.delete("/:id", authHandler, storyWriteLimiter, deleteStoryHandler);
router.post("/:id/like", authHandler, storyWriteLimiter, likeStoryHandler);
router.post("/:id/comments", authHandler, storyWriteLimiter, createCommentHandler as any);

export default router;