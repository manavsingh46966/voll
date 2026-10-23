import { useEffect, useState } from "react";

import { UpdateStoryPayload } from "../api/stories.api";
import { StoryDetail } from "../types/story.types";

/**
 * Manages edit-story form state and payload construction.
 *
 * @param story - Story being edited.
 * @param clearError - Callback to clear action errors.
 * @returns Edit form state, setters, and payload helpers.
 */
export function useEditStoryForm(
  story: StoryDetail | null,
  clearError: () => void,
) {
  const [title, setTitle] = useState("");
  const [bodyMarkdown, setBodyMarkdown] = useState("");
  const [bannerPreviewUrl, setBannerPreviewUrl] = useState<string>();
  const [bannerImageData, setBannerImageData] = useState<string>();
  const [bannerImageMimeType, setBannerImageMimeType] = useState<string>();
  const [bannerRemoved, setBannerRemoved] = useState(false);
  const [eventTimeframe, setEventTimeframe] = useState("");

  useEffect(() => {
    if (!story) return;
    setTitle(story.title);
    setBodyMarkdown(story.bodyMarkdown);
    setBannerPreviewUrl(story.bannerImageUrl || undefined);
    setBannerImageData(undefined);
    setBannerImageMimeType(undefined);
    setBannerRemoved(false);
    setEventTimeframe(story.eventTimeframe || "");
    clearError();
  }, [clearError, story]);

  const originalBanner = story?.bannerImageUrl || "";
  const currentBanner = bannerRemoved ? "" : bannerPreviewUrl || "";
  const hasBannerChanged =
    bannerRemoved || !!bannerImageData || currentBanner !== originalBanner;
  const isValidForm = Boolean(
    title.trim() &&
    bodyMarkdown.trim() &&
    story &&
    (title !== story.title ||
      bodyMarkdown !== story.bodyMarkdown ||
      hasBannerChanged ||
      eventTimeframe !== (story.eventTimeframe || "")),
  );

  const getPayload = (): UpdateStoryPayload => {
    const payload: UpdateStoryPayload = {
      title: title.trim(),
      bodyMarkdown: bodyMarkdown.trim(),
      eventTimeframe: eventTimeframe.trim() || undefined,
    };
    if (bannerImageData && bannerImageMimeType) {
      payload.bannerImageData = bannerImageData;
      payload.bannerImageMimeType = bannerImageMimeType;
    } else if (bannerRemoved) {
      payload.bannerImageUrl = "";
      payload.bannerImageData = "";
      payload.bannerImageMimeType = "";
    }
    return payload;
  };

  return {
    title,
    setTitle,
    bodyMarkdown,
    setBodyMarkdown,
    bannerPreviewUrl,
    setBannerPreviewUrl,
    setBannerImageData,
    setBannerImageMimeType,
    bannerRemoved,
    setBannerRemoved,
    eventTimeframe,
    setEventTimeframe,
    isValidForm,
    getPayload,
  };
}
