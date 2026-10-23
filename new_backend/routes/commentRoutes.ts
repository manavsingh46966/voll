import { Router } from "express";
import {
  deleteCommentHandler,
  getRepliesHandler,
  likeCommentHandler,
  updateCommentHandler,
} from "../controllers/commentController.ts";
import { authHandler, optionalAuthHandler } from "../middleware/authMiddleware.ts";
import { createRateLimit } from "../middleware/rateLimit.ts";

const commentRouter = Router();
const commentReadLimiter = createRateLimit({ windowMs: 60_000, max: 120, scope: "ip" });
const commentWriteLimiter = createRateLimit({ windowMs: 60_000, max: 30, scope: "user_or_ip" });

commentRouter.get("/:id/replies", commentReadLimiter, optionalAuthHandler, getRepliesHandler);
commentRouter.post("/:id/like", commentWriteLimiter, authHandler, likeCommentHandler as any);
commentRouter.put("/:id", commentWriteLimiter, authHandler, updateCommentHandler as any);
commentRouter.delete("/:id", commentWriteLimiter, authHandler, deleteCommentHandler as any);

export default commentRouter;
