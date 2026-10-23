import express from "express";
import {
  refreshJWTController,
  signInWithGoogleController,
  verifyTokenController,
} from "../controllers/authController.ts";
import { authHandler } from "../middleware/authMiddleware.ts";
import { createRateLimit } from "../middleware/rateLimit.ts";

export const authRouter = express.Router();
const authLimiter = createRateLimit({ windowMs: 60_000, max: 20, scope: "ip" });

authRouter.post("/signInWithGoogle", authLimiter, signInWithGoogleController);
authRouter.post("/refreshJWT", authLimiter, refreshJWTController);
authRouter.get(
  "/verify",
  authLimiter,
  authHandler as express.RequestHandler,
  verifyTokenController as express.RequestHandler,
);
