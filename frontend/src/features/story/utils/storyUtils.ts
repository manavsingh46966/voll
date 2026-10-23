import { StoryDetail, StorySummary } from "../types/story.types";

type ApiAuthor =
  | {
      _id?: unknown;
      id?: unknown;
      name?: unknown;
      profileImageUrl?: unknown;
      isFollowing?: unknown;
      followsYou?: unknown;
      isOwner?: unknown;
    }
  | null
  | undefined;

export interface ApiStory {
  _id?: unknown;
  id?: unknown;
  title?: unknown;
  bannerImageUrl?: unknown;
  bannerImageData?: unknown;
  bannerImageMimeType?: unknown;
  excerpt?: unknown;
  author?: ApiAuthor;
  likeCount?: unknown;
  commentCount?: unknown;
  isLiked?: unknown;
  createdAt?: unknown;
  slug?: unknown;
  bodyMarkdown?: unknown;
  eventTimeframe?: unknown;
  viewCount?: unknown;
  status?: unknown;
}

const toStringOrEmpty = (value: unknown): string =>
  typeof value === "string" ? value : "";

const toNumberOrZero = (value: unknown): number =>
  typeof value === "number" ? value : 0;

const normalizeAuthor = (author: ApiAuthor): StorySummary["author"] => {
  return {
    id: toStringOrEmpty(author?._id || author?.id),
    name: toStringOrEmpty(author?.name) || "Unknown",
    profileImageUrl:
      typeof author?.profileImageUrl === "string"
        ? author.profileImageUrl
        : null,
    isFollowing:
      typeof author?.isFollowing === "boolean" ? author.isFollowing : false,
    followsYou:
      typeof author?.followsYou === "boolean" ? author.followsYou : false,
    isOwner: typeof author?.isOwner === "boolean" ? author.isOwner : false,
  };
};

/**
 * Normalizes an API story object into a feed summary.
 *
 * @param story - Raw story payload from the API.
 * @returns Story summary used by the feed UI.
 */
export const normalizeStorySummary = (story: ApiStory): StorySummary => ({
  id: toStringOrEmpty(story._id || story.id),
  title: toStringOrEmpty(story.title),
  bannerImageUrl:
    toStringOrEmpty(story.bannerImageUrl) ||
    (typeof story.bannerImageData === "string" &&
    typeof story.bannerImageMimeType === "string"
      ? `data:${story.bannerImageMimeType};base64,${story.bannerImageData}`
      : ""),
  excerpt: toStringOrEmpty(story.excerpt),
  author: normalizeAuthor(story.author),
  likeCount: toNumberOrZero(story.likeCount),
  commentCount: toNumberOrZero(story.commentCount),
  isLiked: typeof story.isLiked === "boolean" ? story.isLiked : false,
  createdAt: toStringOrEmpty(story.createdAt) || new Date().toISOString(),
  slug: toStringOrEmpty(story.slug),
  status: (typeof story.status === "string"
    ? story.status
    : "published") as StorySummary["status"],
});

/**
 * Normalizes an API story object into article detail data.
 *
 * @param story - Raw story payload from the API.
 * @returns Story detail used by the article UI.
 */
export const normalizeStoryDetail = (story: ApiStory): StoryDetail => ({
  ...normalizeStorySummary(story),
  bodyMarkdown: toStringOrEmpty(story.bodyMarkdown),
  eventTimeframe: toStringOrEmpty(story.eventTimeframe),
  viewCount: toNumberOrZero(story.viewCount),
});

/**
 * Formats an ISO date for story cards and article metadata.
 *
 * @param value - Date string to format.
 * @returns A short readable date.
 */
export const formatStoryDate = (value: string): string => {
  const date = new Date(value);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};
