import { create } from "zustand";

interface FilterState {
  showOnlyMyStories: boolean;
  toggleStoryFilter: () => void;
  // You can easily add Event filters here later!
  // showOnlyMyEvents: boolean;
  // toggleEventFilter: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  showOnlyMyStories: false,
  toggleStoryFilter: () =>
    set((state) => ({ showOnlyMyStories: !state.showOnlyMyStories })),
}));
