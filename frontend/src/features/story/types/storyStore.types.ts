import { StoryDetail, StorySummary } from "./story.types";

export interface StoryFeedState {
  stories: StorySummary[];
  isLoading: boolean;
  isFetchingMore: boolean;
  isRefreshing: boolean;
  hasLoaded: boolean;
  nextCursor?: string;
  hasMore: boolean;
  error: string | null;
  activeAuthorId: string | null;
  loadStories: (authorId?: string) => Promise<void>;
  loadNextPage: () => Promise<void>;
  refreshStories: () => Promise<void>;
  addStoryToFeed: (story: StoryDetail) => void;
  updateStoryInFeed: (storyId: string, updates: Partial<StorySummary>) => void;
  removeStoryFromFeed: (storyId: string) => void;
  updateLikeState: (
    storyId: string,
    likeCount: number,
    isLiked: boolean,
  ) => void;
  updateLikeCount: (storyId: string, likeCount: number) => void;
}
