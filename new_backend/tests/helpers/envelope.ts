import type request from "supertest";
import { expect } from "vitest";
import { z } from "zod";
import type { ErrorType } from "../../types/common/result.ts";

const ErrorEnvelopeSchema = z.object({
    success: z.literal(false),
    errorCode: z.string(),
    message: z.string(),
});

function describeResponse(res: request.Response): string {
    return `HTTP ${String(res.status)} ${JSON.stringify(res.body)}`;
}

/** Asserts the status and the `{ success: true, data }` envelope, and returns `data` parsed by `schema`. */
export function expectData<T>(res: request.Response, status: number, schema: z.ZodType<T>): T {
    expect(res.status, describeResponse(res)).toBe(status);
    return z.object({ success: z.literal(true), data: schema }).parse(res.body).data;
}

/** Asserts the status and the `{ success: false, errorCode, message }` envelope. */
export function expectError(res: request.Response, status: number, errorCode: ErrorType): void {
    expect(res.status, describeResponse(res)).toBe(status);
    const envelope = ErrorEnvelopeSchema.parse(res.body);
    expect(envelope.errorCode).toBe(errorCode);
}

/** Asserts the status and parses a raw (non-envelope) body, as the auth endpoints return. */
export function expectBody<T>(res: request.Response, status: number, schema: z.ZodType<T>): T {
    expect(res.status, describeResponse(res)).toBe(status);
    return schema.parse(res.body);
}

/** Asserts the status only, for 204s and other bodiless responses. */
export function expectStatus(res: request.Response, status: number): void {
    expect(res.status, describeResponse(res)).toBe(status);
}
