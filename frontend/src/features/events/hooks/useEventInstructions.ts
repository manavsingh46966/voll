import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  fetchInstructionsApi,
  addInstructionApi,
} from "../api/event.api";
import type { AddInstructionParams, EventInstruction } from "../types";

/**
 * Hook to fetch instructions for an event.
 *
 * @param {string} eventId - The MongoDB ObjectId event identifier.
 * @returns Query result with instruction list.
 */
export function useEventInstructions(eventId: string) {
  return useQuery<EventInstruction[], Error>({
    queryKey: ["event", "instructions", eventId],
    queryFn: async () => {
      const response = await fetchInstructionsApi(eventId);
      return response.instructions ?? response.result ?? [];
    },
    enabled: eventId.length > 0,
    staleTime: 1000 * 30,
  });
}

/**
 * Mutation hook to post a new instruction (organizer only).
 *
 * @param {string} eventId - Used to invalidate related queries on success.
 * @returns TanStack mutation object.
 */
export function useAddInstruction(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation<
    { success: boolean; message?: string },
    Error,
    AddInstructionParams
  >({
    mutationFn: addInstructionApi,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["event", "instructions", eventId],
      });
    },
  });
}
