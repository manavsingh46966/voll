import { z } from "zod";
import type { Request, Response } from "express";
import { refreshJWTService, signInWithGoogleService } from "../services/user/authService.ts";
import { type AuthenticatedRequest } from "../types/express/authenticatedRequest.ts";
import { sendError } from "../utils/http.ts";

const SignInSchema = z.object({
  idToken: z.string().min(1),
});

const RefreshJWTSchema = z.object({
  refreshToken: z.string().min(1),
});

export async function signInWithGoogleController(
  req: Request,
  res: Response,
): Promise<void> {
  const parsed = SignInSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 400, "BAD_REQUEST", "Invalid sign-in payload.", parsed.error.flatten());
    return;
  }

  const signInResult = await signInWithGoogleService(parsed.data.idToken);
  if (signInResult.success) {
    res.status(200).json(signInResult.data);
    return;
  }

  sendError(res, 401, "UNAUTHORIZED", signInResult.message);
}

export async function refreshJWTController(
  req: Request,
  res: Response,
): Promise<void> {
  const parsed = RefreshJWTSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 400, "BAD_REQUEST", "Invalid refresh token payload.", parsed.error.flatten());
    return;
  }

  const accessTokenResult = await refreshJWTService(parsed.data.refreshToken);
  if (accessTokenResult.success) {
    res.status(200).json({ accessToken: accessTokenResult.data });
    return;
  }

  sendError(res, 401, "UNAUTHORIZED", accessTokenResult.message);
}

export async function verifyTokenController(
  _req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  res.status(200).json({ message: "Token is valid." });
}
