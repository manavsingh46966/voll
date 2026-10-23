import React from "react";
import { useLocalSearchParams } from "expo-router";

import { StoryForm } from "@/src/features/story/modals/StoryForm";

/**
 *
 */
export default function EditorRoute() {
  // 1. Grab the stringified story from the router params
  const { story } = useLocalSearchParams<{ story?: string }>();

  // 2. Parse it back into a JavaScript object (if it exists)
  const parsedStory = story ? JSON.parse(story) : null;

  // 3. Pass it using the correct 'story' prop that the component expects!
  return <StoryForm story={parsedStory} />;
}
