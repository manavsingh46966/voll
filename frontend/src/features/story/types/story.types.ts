export interface StoryAuthor {
  id: string;
  name: string;
  profileImageUrl?: string | null;
  isFollowing?: boolean;
  followsYou?: boolean;
  isOwner?: boolean;
}

export interface StorySummary {
  id: string;
  title: string;
  bannerImageUrl?: string;
  excerpt?: string;
  author: StoryAuthor;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  createdAt: string;
  slug: string;
  status: "draft" | "pending_approval" | "published" | "archived";
}

export type StoryDetail = StorySummary & {
  bodyMarkdown: string;
  eventTimeframe?: string;
  viewCount: number;
};
