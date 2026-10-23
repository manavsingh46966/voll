import { useMutation, useQueryClient } from "@tanstack/react-query";

import { joinEventApi } from "../api/event.api";
import type { JoinEventRequest, JoinEventResponse } from "../types";

/**
 * Mutation hook for joining an event or sending a join request.
 * On success it invalidates the event details cache so the UI
 * reflects the updated isJoined / isPending state.
 *
 * @param {string} eventId - The MongoDB ObjectId used to invalidate the details query.
 * @returns {object} TanStack mutation object with mutate, isPending, isSuccess, data, etc.
 */
export function useJoinEvent(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation<JoinEventResponse, Error, JoinEventRequest>({
    mutationFn: joinEventApi,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["event", "details", eventId],
      });
    },
  });
}
