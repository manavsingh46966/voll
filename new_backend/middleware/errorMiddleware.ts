import type { Request, Response, NextFunction } from "express";
import { sendError } from "../utils/http.ts";

export function globalErrorHandler(err: unknown, req: Request, res: Response, next: NextFunction): void {
    console.error("Unhandled Error:", {
        path: req.originalUrl,
        method: req.method,
        error: err,
    });

    if (res.headersSent) {
        next(err);
        return;
    }

    sendError(res, 500, "INTERNAL_ERROR", "Internal Server Error");
}
