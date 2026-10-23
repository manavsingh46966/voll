import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { JWT_KEY } from "../config/envConfig.ts";
import { UserModel } from "../models/user.ts";
import { UserBasicDetailsSchema } from "../schemas/userBasicDetails.ts";
import { sendError } from "../utils/http.ts";

export async function authHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    sendError(res, 401, "UNAUTHORIZED", "Invalid Authorization header");
    return;
  }

  try {
    const accessTokenString = authHeader.split(" ")[1];
    const verifiedAccessToken = jwt.verify(accessTokenString, JWT_KEY);
    const parsedAccessToken = UserBasicDetailsSchema.safeParse(verifiedAccessToken);
    if (!parsedAccessToken.success) {
      console.error("[Auth Error] Token parsing failed:", parsedAccessToken.error);
      sendError(res, 401, "UNAUTHORIZED", "Invalid or missing credentials.");
      return;
    }

    const user = await UserModel.findById(parsedAccessToken.data.id)
      .select("role accountStatus permissions tokenVersion")
      .lean();

    if (!user) {
      console.error("[Auth Error] User not found in DB for ID:", parsedAccessToken.data.id);
      sendError(res, 401, "UNAUTHORIZED", "Invalid or missing credentials.");
      return;
    }

    if (user.accountStatus !== "active") {
      console.error("[Auth Error] User account is not active:", user.accountStatus);
      sendError(res, 401, "UNAUTHORIZED", "Invalid or missing credentials.");
      return;
    }

    if ((user.tokenVersion ?? 0) !== parsedAccessToken.data.tokenVersion) {
      console.error("[Auth Error] Token version mismatch.");
      console.error("  -> DB User:", JSON.stringify(user, null, 2));
      console.error("  -> Token Payload:", JSON.stringify(parsedAccessToken.data, null, 2));
      sendError(res, 401, "UNAUTHORIZED", "Invalid or missing credentials.");
      return;
    }

    req.user = parsedAccessToken.data;
    next();
  } catch (error) {
    console.error("[Auth Error] JWT verification threw:", error);
    sendError(res, 401, "UNAUTHORIZED", "Invalid or missing credentials.");
  }
}

export async function optionalAuthHandler(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    next();
    return;
  }

  try {
    const accessTokenString = authHeader.split(" ")[1];
    const verifiedAccessToken = jwt.verify(accessTokenString, JWT_KEY);
    const parsedAccessToken = UserBasicDetailsSchema.safeParse(verifiedAccessToken);
    if (parsedAccessToken.success) {
      const user = await UserModel.findById(parsedAccessToken.data.id)
        .select("accountStatus tokenVersion")
        .lean();
      if (user?.accountStatus === "active" && (user.tokenVersion ?? 0) === parsedAccessToken.data.tokenVersion) {
        req.user = parsedAccessToken.data;
      }
    }
    next();
  } catch {
    next();
  }
}
