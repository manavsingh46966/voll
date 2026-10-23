import admin from "firebase-admin";
import jwt, { type SignOptions } from "jsonwebtoken";

import { UserModel } from "../../models/user.ts";
import { RefreshTokenModel } from "../../models/token.ts";
import { generateRefreshToken } from "../../utils/tokenUtils.ts";
import { type Result } from "../../types/common/result.ts";
import { JWT_EXPIRY, JWT_KEY } from "../../config/envConfig.ts";

export interface AuthSessionPayload {
    refreshToken: string;
    accessToken: string;
    userId: string;
    role: string;
    accountStatus: string;
    permissions: string[];
    isRegistered: boolean;
}

function signAccessToken(userDoc: {
    _id: unknown;
    email: string;
    role?: string;
    accountStatus?: string;
    permissions?: string[];
    tokenVersion?: number;
}): string {
    const payload = {
        id: String(userDoc._id),
        email: userDoc.email,
        role: userDoc.role ?? "user",
        accountStatus: userDoc.accountStatus ?? "active",
        permissions: userDoc.permissions ?? [],
        tokenVersion: userDoc.tokenVersion ?? 0,
    };
    console.log("[JWT] Signing Access Token for:", payload.email, "Version:", payload.tokenVersion);
    return jwt.sign(payload, JWT_KEY, { expiresIn: JWT_EXPIRY as SignOptions["expiresIn"] });
}

export async function signInWithGoogleService(idToken: string): Promise<Result<AuthSessionPayload>> {
    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);

        const userEmail = decodedToken.email ?? null;
        const userPhone = decodedToken.phone_number ?? "";

        // NOTE: userPhone requirement commented out since Firebase Phone Auth / OTP is disabled
        if (!userEmail) {
            return { success: false, errorType: "UNAUTHORIZED", message: "Invalid credentials: email is required." };
        }

        const user = await UserModel.findOneAndUpdate(
            {
                email: userEmail
            },
            {
                $set: {
                    accountStatus: "active",
                },
                $setOnInsert: { 
                    email: userEmail,
                    phoneNumber: userPhone,
                    role: "user",
                    permissions: [],
                    tokenVersion: 0,
                }
            },
            {
                new: true,
                upsert: true,
                runValidators: true
            }
        ).lean();

        if (!user) {
            return { success: false, errorType: "INTERNAL_ERROR", message: "Failed to persist user profile." };
        }

        const refreshTokenString = await generateRefreshToken();
        const accessToken = signAccessToken(user);
        await RefreshTokenModel.create(
            {
                refreshToken: refreshTokenString,
                user: user._id
            }
        );

        return {
            success: true,
            data: {
                refreshToken: refreshTokenString,
                accessToken,
                userId: String(user._id),
                role: user.role ?? "user",
                accountStatus: user.accountStatus ?? "active",
                permissions: user.permissions ?? [],
                isRegistered: Boolean(user.name),
            },
        };
    } catch (err) {
        console.error("[AuthService] Error in signInWithGoogleService:", err);
        return { success: false, errorType: "UNAUTHORIZED", message: "Invalid credentials or token verification failed." };
    }
}


export async function refreshJWTService(refreshToken: string): Promise<Result<string>> {
    try {
        console.log("[AuthService] Refreshing token:", refreshToken);
        const refreshTokenDoc = await RefreshTokenModel.findOne({ refreshToken: refreshToken }).lean();
        if (!refreshTokenDoc) {
            console.error("[AuthService] Refresh token not found in DB.");
            return { success: false, errorType: "UNAUTHORIZED", message: "Invalid or expired refresh token." };
        }

        console.log("[AuthService] Found token doc for user:", refreshTokenDoc.user);
        const userDoc = await UserModel.findOne({ _id: refreshTokenDoc.user }).lean();
        if (!userDoc) {
            console.error("[AuthService] User not found for refresh token.");
            return { success: false, errorType: "UNAUTHORIZED", message: "Invalid or expired refresh token." };
        }

        if (userDoc.accountStatus !== "active") {
            console.error("[AuthService] User account not active:", userDoc.accountStatus);
            return { success: false, errorType: "FORBIDDEN", message: "Account is not active." };
        }

        console.log("[AuthService] Successfully refreshed token.");
        return { success: true, data: signAccessToken(userDoc) };
    } catch (err) {
        console.error("[AuthService] Error in refreshJWTService:", err);
        return { success: false, errorType: "INTERNAL_ERROR", message: "Failed to refresh token." };
    }
}
