import { create } from "zustand";

import { StoryFeedState } from "../types/storyStore.types";

import { createStoryStoreActions } from "./storyStoreActions";

export const useStoryStore = create<StoryFeedState>((set, get) => ({
  stories: [],
  isLoading: false,
  isFetchingMore: false,
  isRefreshing: false,
  hasLoaded: false,
  nextCursor: undefined,
  hasMore: true,
  error: null,
  activeAuthorId: null,
  ...createStoryStoreActions(set, get),
}));
