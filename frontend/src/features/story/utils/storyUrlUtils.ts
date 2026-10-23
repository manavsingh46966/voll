/**
 * Utility for formatting story URLs and working with authors.
 */

/**
 * Formats a user name into a URL-friendly author slug.
 * e.g., "John Doe" -> "john-doe"
 *
 * @param name - Author display name.
 * @returns URL-safe author segment.
 */
export const formatAuthorSlug = (name: string): string => {
  if (!name) return "author";
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
};

/**
 * Generates the Medium-like URL path for a story.
 * e.g., /@john-doe/my-story-slug
 *
 * @param authorName - Story author display name.
 * @param storySlug - Story slug from the API.
 * @returns Relative article route.
 */
export const getStoryUrl = (authorName: string, storySlug: string): string => {
  const authorSegment = formatAuthorSlug(authorName);
  return `/story/@${authorSegment}/${storySlug}`;
};
