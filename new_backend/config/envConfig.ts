import dotenv from "dotenv";
dotenv.config();

function getEnvironmentVariableOrCrash(variable: string): string {
    const value = process.env[variable];
    if (!value) {
        console.log(`${variable} environment variable not present!`);
        process.exit(1);
    }
    return value;
}

export const MONGODB_URI = getEnvironmentVariableOrCrash("MONGODB_URI");
export const JWT_KEY = getEnvironmentVariableOrCrash("JWT_KEY");
export const JWT_EXPIRY = getEnvironmentVariableOrCrash("JWT_EXPIRY");
export const SERVER_PORT = process.env.SERVER_PORT ?? "3000";
export const CORS_ORIGIN = process.env.CORS_ORIGIN;
export const STORY_CACHE_TTL_MS = Number(process.env.STORY_CACHE_TTL_MS ?? 30000);
export const STORY_CACHE_MAX_ITEMS = Number(process.env.STORY_CACHE_MAX_ITEMS ?? 500);
export const METRICS_ENABLED = process.env.METRICS_ENABLED !== "false";
export const CONTENT_BLOCKLIST = (process.env.CONTENT_BLOCKLIST ?? "")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);
export const FEATURE_FLAGS = {
    storyV2: process.env.FF_STORY_V2 === "true",
    storyReactions: process.env.FF_STORY_REACTIONS === "true",
    storyModeration: process.env.FF_STORY_MODERATION !== "false",
    storyCaching: process.env.FF_STORY_CACHING !== "false",
};
