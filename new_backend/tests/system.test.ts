import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { app } from "../app.ts";
import { api } from "./helpers/api.ts";
import { expectBody, expectData, expectError, expectStatus } from "./helpers/envelope.ts";
import { hoursFromNow } from "./helpers/fixtures.ts";
import { seedUser } from "./helpers/users.ts";

// Fake S3 settings so the presign path can run without AWS (signing is local, no network).
vi.hoisted(() => {
    process.env.AWS_S3_BUCKET = "volstory-test-bucket";
    process.env.AWS_REGION = "ap-south-1";
    process.env.AWS_ACCESS_KEY_ID = "test-access-key";
    process.env.AWS_SECRET_ACCESS_KEY = "test-secret-key";
});

const StatusSchema = z.object({ status: z.string() });

describe("system routes", () => {
    it("serves the root banner", async () => {
        const res = await request(app).get("/");
        expectBody(res, 200, z.object({ status: z.literal("OK") }));
    });

    it("reports liveness and readiness under /api and /api/v1", async () => {
        expectBody(await api().get("/health/live"), 200, StatusSchema);
        const ready = expectBody(await api().get("/health/ready"), 200, StatusSchema);
        expect(ready.status).toBe("ready");
        expectBody(await request(app).get("/api/v1/health/live"), 200, StatusSchema);
    });

    it("exposes feature flags", async () => {
        expectBody(await api().get("/feature-flags"), 200, z.object({ storyModeration: z.boolean() }));
    });

    it("returns the error envelope for unknown routes", async () => {
        expectError(await api().get("/does-not-exist"), 404, "NOT_FOUND");
    });

    it("sets the X-API-Version header", async () => {
        const res = await api().get("/health/live");
        expect(res.get("X-API-Version")).toBe("v1");
    });

    it("mounts domain routers under /api/v1 as well", async () => {
        const res = await request(app).get("/api/v1/events");
        expectData(res, 200, z.array(z.unknown()));
    });
});

describe("rate limiting", () => {
    it("returns 429 with Retry-After once a limiter's max is exceeded", async () => {
        const client = api({ ip: "203.0.113.10" });
        for (let i = 0; i < 20; i++) {
            expectStatus(await client.post("/auth/refreshJWT", {}), 400);
        }
        const res = await client.post("/auth/refreshJWT", {});
        expectStatus(res, 429);
        expect(res.get("Retry-After")).toBeDefined();
    });

    it.skip("X1: reads on one router do not consume another router's budget (VOL-003)", async () => {
        const client = api({ ip: "203.0.113.20" });
        for (let i = 0; i < 20; i++) {
            expectStatus(await client.get("/stories"), 200);
        }
        const res = await client.post("/auth/refreshJWT", { refreshToken: "unknown" });
        expectStatus(res, 401);
    });

    it.skip("X2: changing X-Forwarded-For does not reset the limit (VOL-003)", async () => {
        for (let i = 0; i < 20; i++) {
            expectStatus(await api({ ip: `198.51.100.${String(i)}` }).post("/auth/refreshJWT", {}), 400);
        }
        expectStatus(await api({ ip: "198.51.100.250" }).post("/auth/refreshJWT", {}), 429);
    });

    it.skip("VOL-003: the 429 response uses the standard error envelope", async () => {
        const client = api({ ip: "203.0.113.30" });
        for (let i = 0; i < 20; i++) {
            await client.post("/auth/refreshJWT", {});
        }
        expectError(await client.post("/auth/refreshJWT", {}), 429, "RATE_LIMITED");
    });
});

describe("S3 presigned URLs", () => {
    it("requires authentication", async () => {
        expectError(await api().get("/s3/presigned-url?fileName=a.jpg"), 401, "UNAUTHORIZED");
    });

    it("rejects a request without fileName", async () => {
        const user = await seedUser();
        expectError(await api({ as: user }).get("/s3/presigned-url"), 400, "BAD_REQUEST");
    });

    it.skip("X3: returns a presigned URL in the standard envelope when S3 is configured via envConfig (VOL-004)", async () => {
        const user = await seedUser();
        const res = await api({ as: user }).get("/s3/presigned-url?fileName=cover.jpg&contentType=image/jpeg&purpose=event-cover");
        const data = expectData(res, 200, z.object({ presignedUrl: z.string(), publicUrl: z.string(), key: z.string() }));
        expect(data.key).toContain("cover.jpg");
    });
});

describe("service error handling", () => {
    it.skip("X4: a Mongoose validation error maps to 400, not a generic 500 (VOL-005)", async () => {
        const user = await seedUser();
        const res = await api({ as: user }).post("/events", {
            title: "Bad enum",
            fromDateTime: hoursFromNow(24),
            toDateTime: hoursFromNow(26),
            visibility: "not-a-visibility",
        });
        expectError(res, 400, "BAD_REQUEST");
    });

    it.todo("X4: unexpected service errors are logged with the operation name and a stack trace (VOL-005)");
});
