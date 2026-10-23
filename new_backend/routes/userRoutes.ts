import express, { type RequestHandler } from "express";
import { createAccountController } from "../controllers/userController.ts";
import {
  followUserController,
  getFollowersController,
  getFollowingController,
  getMyProfileController,
  getUserProfileController,
  searchUsersController,
  unfollowUserController,
  updateMyProfileController,
  updateProfilePhotoController,
} from "../controllers/profileController.ts";
import { authHandler } from "../middleware/authMiddleware.ts";

export const userRouter = express.Router();

// Onboarding creation
userRouter.post("/createAccount", authHandler, createAccountController as RequestHandler);

// Profile routes
userRouter.get("/me/profile", authHandler, getMyProfileController as RequestHandler);
userRouter.put("/me/profile", authHandler, updateMyProfileController as RequestHandler);
userRouter.put("/me/profile/photo", authHandler, updateProfilePhotoController as RequestHandler);

// Search users
userRouter.get("/search", authHandler, searchUsersController as RequestHandler);

// User public profile & follows
userRouter.get("/:userId/profile", authHandler, getUserProfileController as RequestHandler);
userRouter.post("/:userId/follow", authHandler, followUserController as RequestHandler);
userRouter.delete("/:userId/follow", authHandler, unfollowUserController as RequestHandler);
userRouter.get("/:userId/followers", authHandler, getFollowersController as RequestHandler);
userRouter.get("/:userId/following", authHandler, getFollowingController as RequestHandler);

export default userRouter;