import type { NextFunction, Request, Response } from "express";
import type { UserPermission } from "../models/user.ts";
import { sendError } from "../utils/http.ts";

function hasPermission(req: Request, permission: UserPermission): boolean {
    if (!req.user) return false;
    if (req.user.accountStatus !== "active") return false;
    if (req.user.role === "superadmin") return true;
    return req.user.permissions.includes(permission);
}

export function requirePermission(permission: UserPermission) {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            sendError(res, 401, "UNAUTHORIZED", "Authentication required.");
            return;
        }

        if (!hasPermission(req, permission)) {
            sendError(res, 403, "FORBIDDEN", "You do not have permission to perform this action.");
            return;
        }

        next();
    };
}

export function canManageOwnResource(req: Request, ownerId: string, elevatedPermission: UserPermission): boolean {
    if (!req.user) return false;
    if (req.user.accountStatus !== "active") return false;
    if (req.user.role === "superadmin") return true;
    if (req.user.permissions.includes(elevatedPermission)) return true;
    return req.user.id === ownerId;
}
