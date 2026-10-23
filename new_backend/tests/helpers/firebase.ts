import { vi } from "vitest";

export interface DecodedIdTokenStub {
    uid: string;
    email?: string;
    phone_number?: string;
}

/** Controls what `admin.auth().verifyIdToken()` resolves to. Rejects by default (reset before each test). */
export const verifyIdToken = vi.fn<(idToken: string) => Promise<DecodedIdTokenStub>>();

export const firebaseAdminStub = {
    auth: (): { verifyIdToken: typeof verifyIdToken } => ({ verifyIdToken }),
    initializeApp: vi.fn(),
    credential: { applicationDefault: vi.fn() },
};
