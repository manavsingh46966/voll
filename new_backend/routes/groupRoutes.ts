import { Router } from "express";
import {
  addMemberHandler,
  createGroupHandler,
  deleteGroupHandler,
  getAvailableUsersHandler,
  getGroupByIdHandler,
  getGroupPhotoHandler,
  getGroupsHandler,
  removeMemberHandler,
  updateGroupHandler,
  promoteToAdminHandler,
  demoteAdminHandler,
} from "../controllers/groupController.ts";
import { authHandler } from "../middleware/authMiddleware.ts";
import { createRateLimit } from "../middleware/rateLimit.ts";

const router = Router();
const groupReadLimiter = createRateLimit({ windowMs: 60_000, max: 120, scope: "ip" });
const groupWriteLimiter = createRateLimit({ windowMs: 60_000, max: 30, scope: "user_or_ip" });

router.get("/", groupReadLimiter, authHandler, getGroupsHandler);
router.post("/", groupWriteLimiter, authHandler, createGroupHandler);
router.get("/available-users", groupReadLimiter, authHandler, getAvailableUsersHandler);
router.get("/:id", groupReadLimiter, authHandler, getGroupByIdHandler);
router.get("/:id/photo", groupReadLimiter, getGroupPhotoHandler);
router.put("/:id", groupWriteLimiter, authHandler, updateGroupHandler);
router.delete("/:id", groupWriteLimiter, authHandler, deleteGroupHandler);
router.post("/:id/members", groupWriteLimiter, authHandler, addMemberHandler);
router.delete("/:id/members/:userId", groupWriteLimiter, authHandler, removeMemberHandler);
router.post("/:id/admins", groupWriteLimiter, authHandler, promoteToAdminHandler);
router.delete("/:id/admins/:userId", groupWriteLimiter, authHandler, demoteAdminHandler);

export default router;
