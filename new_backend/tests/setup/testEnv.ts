import { randomUUID } from "node:crypto";
import mongoose from "mongoose";
import { afterAll, beforeAll, beforeEach, inject, vi } from "vitest";
import { verifyIdToken } from "../helpers/firebase.ts";

// envConfig.ts calls dotenv.config(). Stub it so values from the developer's .env never reach tests.
vi.mock("dotenv", () => ({ default: { config: (): Record<string, never> => ({}) } }));

// Tests never call initFirebase(); the auth service talks to this stub instead of Google.
vi.mock("firebase-admin", async () => {
    const { firebaseAdminStub } = await import("../helpers/firebase.ts");
    return { default: firebaseAdminStub };
});

const mongoUri = inject("mongoUri");

// Required by config/envConfig.ts, which exits the process when any of them is missing.
process.env.MONGODB_URI = mongoUri;
process.env.JWT_KEY = "volstory-test-jwt-key";
process.env.JWT_EXPIRY = "1h";

beforeAll(async () => {
    await mongoose.connect(mongoUri, { dbName: `volstory_test_${randomUUID()}` });
    // Build unique and text indexes up front so tests see production constraints.
    await mongoose.connection.syncIndexes();
});

beforeEach(async () => {
    verifyIdToken.mockReset();
    verifyIdToken.mockRejectedValue(new Error("firebase stub: no decoded token configured"));
    await Promise.all(
        Object.values(mongoose.connection.collections).map((collection) => collection.deleteMany({})),
    );
});

afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
});
