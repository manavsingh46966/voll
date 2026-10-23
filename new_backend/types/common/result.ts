export type ErrorType =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

export type Result<T = void> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      errorType: ErrorType;
      message: string;
      details?: unknown;
    };