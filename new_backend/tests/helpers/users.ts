import jwt from "jsonwebtoken";
import { JWT_KEY } from "../../config/envConfig.ts";
import {
    type AccountStatus,
    type UserPermission,
    type UserRole,
    UserModel,
} from "../../models/user.ts";
import type { UserBasicDetails } from "../../schemas/userBasicDetails.ts";

export interface SeedUserOptions {
    role?: UserRole;
    permissions?: UserPermission[];
    accountStatus?: AccountStatus;
    tokenVersion?: number;
    /** `null` seeds a stub user that hasn't finished registration. */
    name?: string | null;
    email?: string;
}

export interface SeededUser {
    id: string;
    email: string;
    name: string | null;
    role: UserRole;
    accountStatus: AccountStatus;
    permissions: UserPermission[];
    tokenVersion: number;
}

let userSequence = 0;

/** Inserts a user straight into the database, bypassing Google sign-in. */
export async function seedUser(options: SeedUserOptions = {}): Promise<SeededUser> {
    userSequence += 1;
    const role = options.role ?? "user";
    const accountStatus = options.accountStatus ?? "active";
    const permissions = options.permissions ?? [];
    const tokenVersion = options.tokenVersion ?? 0;
    const email = options.email ?? `user${String(userSequence)}@volstory.test`;
    const name = options.name === undefined ? `Test User ${String(userSequence)}` : options.name;

    const doc = await UserModel.create({
        email,
        phoneNumber: `+9100000${String(userSequence).padStart(5, "0")}`,
        role,
        accountStatus,
        permissions,
        tokenVersion,
        ...(name === null ? {} : { name }),
    });

    return { id: doc._id.toString(), email, name, role, accountStatus, permissions, tokenVersion };
}

/** Signs an access token the same way authService does, using the test JWT_KEY. */
export function tokenFor(user: SeededUser, overrides: Partial<UserBasicDetails> = {}): string {
    const payload: UserBasicDetails = {
        id: user.id,
        email: user.email,
        role: user.role,
        accountStatus: user.accountStatus,
        permissions: user.permissions,
        tokenVersion: user.tokenVersion,
        ...overrides,
    };
    return jwt.sign(payload, JWT_KEY, { expiresIn: 3600 });
}
