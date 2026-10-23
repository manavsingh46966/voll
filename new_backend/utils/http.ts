import type { Response } from "express";
import type { Result, ErrorType } from "../types/common/result.ts"; // Adjust path if needed

// Centralized mapping: Service Error -> HTTP Status Code
const statusCodeMap: Record<ErrorType, number> = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
};

/**
 * Automatically unwraps a Service Result and sends the correct HTTP response.
 */
export function sendResult(
  res: Response,
  result: Result<any>,
  defaultSuccessCode = 200
): void {
  if (result.success) {
    res.status(defaultSuccessCode).json({
      success: true,
      data: result.data,
    });
    return;
  }

  const statusCode = statusCodeMap[result.errorType] || 500;

  res.status(statusCode).json({
    success: false,
    errorCode: result.errorType, // e.g., "NOT_FOUND"
    message: result.message,
    error: result.message, // Kept for backward compatibility with your frontend
    details: result.details,
  });
}

// Retained for manual overrides or generic responses
export function sendSuccess(
  res: Response,
  data: unknown,
  statusCode = 200
): void {
  res.status(statusCode).json({ success: true, data });
}

export function sendError(
  res: Response,
  statusCode: number,
  errorCode: ErrorType,
  message: string,
  details?: unknown
): void {
  res.status(statusCode).json({
    success: false,
    errorCode,
    message,
    error: message,
    details,
  });
}