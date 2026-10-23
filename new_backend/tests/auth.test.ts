import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { RefreshTokenModel } from "../models/token.ts";
import { UserModel } from "../models/user.ts";
import { api } from "./helpers/api.ts";
import { expectBody, expectError, expectStatus } from "./helpers/envelope.ts";
import { verifyIdToken } from "./helpers/firebase.ts";
import { seedUser, tokenFor } from "./helpers/users.ts";

const SessionSchema = z.object({
    accessToken: z.string(),
    refreshToken: z.string(),
    userId: z.string(),
    role: z.string(),
    isRegistered: z.boolean(),
});

const MessageSchema = z.object({ message: z.string() });

const validAccount = {
    name: "Asha Patel",
    dateOfBirth: "1998-04-12",
    gender: "female",
    city: "Pune",
    interests: ["environment"],
    skillsets: ["first-aid"],
};

async function signIn(email: string): Promise<z.infer<typeof SessionSchema>> {
    verifyIdToken.mockResolvedValue({ uid: "firebase-uid", email, phone_number: "+919999999999" });
    return expectBody(await api().post("/auth/signInWithGoogle", { idToken: "stub" }), 200, SessionSchema);
}

describe("GET /auth/verify (authHandler)", () => {
    it("accepts a valid token", async () => {
        const user = await seedUser();
        expectBody(await api({ as: user }).get("/auth/verify"), 200, MessageSchema);
    });

    it("rejects a missing Authorization header", async () => {
        expectError(await api().get("/auth/verify"), 401, "UNAUTHORIZED");
    });

    it("rejects a token that isn't a valid JWT", async () => {
        expectError(await api({ as: "not-a-jwt" }).get("/auth/verify"), 401, "UNAUTHORIZED");
    });

    it("rejects a token whose tokenVersion was revoked", async () => {
        const user = await seedUser({ tokenVersion: 1 });
        const stale = tokenFor(user, { tokenVersion: 0 });
        expectError(await api({ as: stale }).get("/auth/verify"), 401, "UNAUTHORIZED");
    });

    it("rejects a suspended account even with a token minted as active", async () => {
        const user = await seedUser({ accountStatus: "suspended" });
        const token = tokenFor(user, { accountStatus: "active" });
        expectError(await api({ as: token }).get("/auth/verify"), 401, "UNAUTHORIZED");
    });

    it("rejects a token for a user that no longer exists", async () => {
        const user = await seedUser();
        await UserModel.deleteOne({ _id: user.id });
        expectError(await api({ as: user }).get("/auth/verify"), 401, "UNAUTHORIZED");
    });
});

describe("POST /auth/signInWithGoogle", () => {
    it("rejects a missing idToken with 400", async () => {
        expectError(await api().post("/auth/signInWithGoogle", {}), 400, "BAD_REQUEST");
    });

    it("creates a stub user and returns the raw session shape", async () => {
        const session = await signIn("new.user@volstory.test");

        expect(session.isRegistered).toBe(false);
        expect(session.role).toBe("user");
        expect(await UserModel.countDocuments({ email: "new.user@volstory.test" })).toBe(1);
        expect(await RefreshTokenModel.countDocuments({ refreshToken: session.refreshToken })).toBe(1);
        expectStatus(await api({ as: session.accessToken }).get("/auth/verify"), 200);
    });

    it("reports isRegistered for a user who finished registration", async () => {
        await seedUser({ email: "done@volstory.test", name: "Done" });
        const session = await signIn("done@volstory.test");
        expect(session.isRegistered).toBe(true);
    });

    it("rejects a Firebase token without a phone number", async () => {
        verifyIdToken.mockResolvedValue({ uid: "firebase-uid", email: "nophone@volstory.test" });
        expectError(await api().post("/auth/signInWithGoogle", { idToken: "stub" }), 401, "UNAUTHORIZED");
    });

    it.todo("A3: document the phone_number requirement and return a specific message (VOL-019)");
});

describe("POST /auth/refreshJWT", () => {
    it("rejects a missing refreshToken with 400", async () => {
        expectError(await api().post("/auth/refreshJWT", {}), 400, "BAD_REQUEST");
    });

    it("rejects an unknown refresh token with a real message", async () => {
        const res = await api().post("/auth/refreshJWT", { refreshToken: "unknown" });
        expectError(res, 401, "UNAUTHORIZED");
        expect(MessageSchema.parse(res.body).message).toBe("Invalid or expired refresh token.");
    });

    it("issues a working access token for a valid refresh token", async () => {
        const session = await signIn("refresh@volstory.test");
        const res = await api().post("/auth/refreshJWT", { refreshToken: session.refreshToken });
        const { accessToken } = expectBody(res, 200, z.object({ accessToken: z.string() }));
        expectStatus(await api({ as: accessToken }).get("/auth/verify"), 200);
    });

    it("refuses to refresh a suspended account", async () => {
        const session = await signIn("suspend@volstory.test");
        await UserModel.updateOne({ email: "suspend@volstory.test" }, { accountStatus: "suspended" });
        const res = await api().post("/auth/refreshJWT", { refreshToken: session.refreshToken });
        expectError(res, 401, "UNAUTHORIZED");
    });

    it.skip("A5: never logs the refresh token (VOL-019)", async () => {
        const session = await signIn("logging@volstory.test");
        const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
        const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

        await api().post("/auth/refreshJWT", { refreshToken: session.refreshToken });

        const logged = JSON.stringify([...logSpy.mock.calls, ...errorSpy.mock.calls]);
        logSpy.mockRestore();
        errorSpy.mockRestore();
        expect(logged).not.toContain(session.refreshToken);
        expect(logged).not.toContain("logging@volstory.test");
    });
});

describe("POST /user/createAccount", () => {
    it("requires authentication", async () => {
        expectError(await api().post("/user/createAccount", validAccount), 401, "UNAUTHORIZED");
    });

    it("completes registration for a stub user", async () => {
        const user = await seedUser({ name: null });
        const res = await api({ as: user }).post("/user/createAccount", validAccount);
        const body = expectBody(res, 200, z.object({ userId: z.string(), isRegistered: z.boolean() }));

        expect(body).toEqual({ userId: user.id, isRegistered: true });
        const stored = await UserModel.findById(user.id).lean();
        expect(stored?.name).toBe("Asha Patel");
        expect(stored?.city).toBe("Pune");
    });

    it.skip("A1: an invalid payload returns 400 with field details (VOL-019)", async () => {
        const user = await seedUser({ name: null });
        const res = await api({ as: user }).post("/user/createAccount", { name: "Missing everything else" });
        expectError(res, 400, "BAD_REQUEST");
    });

    it.todo("A2: auth and user services return { errorType, message } per Result; enforced by npm run type-check (VOL-002)");
    it.todo("A4: a role or permission change applies without waiting for token expiry (VOL-019 decision)");
});
