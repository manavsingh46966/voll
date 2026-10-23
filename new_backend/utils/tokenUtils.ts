import crypto from "crypto";
import { promisify } from "util";

const randomBytesAsync = promisify(crypto.randomBytes);

export async function generateRefreshToken(): Promise<string> {
    const buffer = await randomBytesAsync(32);
    return buffer.toString("hex");
}