import { useMutation, useQueryClient } from "@tanstack/react-query";

import { toggleInterestApi } from "../api/event.api";

/**
 * Mutation hook for toggling the current user's interest in an event.
 * On success it invalidates the event details cache so any server-side
 * interest data (if added later) is refreshed.
 *
 * @param {string} eventId - The MongoDB ObjectId of the event.
 * @returns {object} TanStack mutation object (mutate, isPending, etc.).
 */
export function useToggleInterest(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean }, Error, void>({
    mutationFn: () => toggleInterestApi(eventId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["event", "details", eventId],
      });
    },
  });
}
