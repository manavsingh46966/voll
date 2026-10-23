import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  fetchEventQnaApi,
  postQnaMessageApi,
  postQnaReplyApi,
} from "../api/event.api";
import type {
  PostQnaMessageParams,
  PostQnaReplyParams,
  QnaMessage,
} from "../types";

/**
 * Hook to fetch Q&A messages for an event.
 *
 * @param {string} eventId - The MongoDB ObjectId event identifier.
 * @returns Query result with Q&A messages.
 */
export function useEventQna(eventId: string) {
  return useQuery<QnaMessage[], Error>({
    queryKey: ["event", "qna", eventId],
    queryFn: async () => {
      const response = await fetchEventQnaApi(eventId);
      return response.result.messages ?? [];
    },
    enabled: eventId.length > 0,
    staleTime: 1000 * 30,
  });
}

/**
 * Mutation hook to post a new Q&A message.
 *
 * @param {string} eventId - Used to invalidate related queries on success.
 * @returns TanStack mutation object.
 */
export function usePostQnaMessage(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation<
    { success: boolean; message?: string },
    Error,
    PostQnaMessageParams
  >({
    mutationFn: postQnaMessageApi,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["event", "qna", eventId],
      });
    },
  });
}

/**
 * Mutation hook to post a reply to a Q&A message.
 *
 * @param {string} eventId - Used to invalidate related queries on success.
 * @returns TanStack mutation object.
 */
export function usePostQnaReply(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation<
    { success: boolean; message?: string },
    Error,
    PostQnaReplyParams
  >({
    mutationFn: postQnaReplyApi,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["event", "qna", eventId],
      });
    },
  });
}
