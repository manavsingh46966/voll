import { CONTENT_BLOCKLIST, FEATURE_FLAGS } from "../config/envConfig.ts";

const escaped = CONTENT_BLOCKLIST.map((item) =>
  item.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
);
const blocklistRegex =
  escaped.length > 0 ? new RegExp(`\\b(${escaped.join("|")})\\b`, "i") : null;

export function violatesModeration(text: string): boolean {
  if (!FEATURE_FLAGS.storyModeration) return false;
  if (!blocklistRegex) return false;
  return blocklistRegex.test(text);
}
