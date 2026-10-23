import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  fetchWaitingListApi,
  fetchEventVolunteersApi,
  handleJoinRequestApi,
} from "../api/event.api";
import type { HandleJoinRequestParams, Participant, WaitingUser } from "../types";

/**
 * Hook to fetch event volunteers (registered + interested).
 *
 * @param {string} eventId - The MongoDB ObjectId event identifier.
 * @returns Query result with participant lists.
 */
export function useEventParticipants(eventId: string) {
  return useQuery<
    { registeredUsers: Participant[]; interestedUsers: Participant[] },
    Error
  >({
    queryKey: ["event", "participants", eventId],
    queryFn: async () => {
      const response = await fetchEventVolunteersApi(eventId);
      return response.result;
    },
    enabled: eventId.length > 0,
    staleTime: 1000 * 30,
  });
}

/**
 * Hook to fetch the pending join request (waiting) list for an event.
 *
 * @param {string} eventId - The MongoDB ObjectId event identifier.
 * @returns Query result with waiting users and ev_id.
 */
export function useEventWaitingList(eventId: string) {
  return useQuery<{ result: WaitingUser[]; ev_id: string }, Error>({
    queryKey: ["event", "waitingList", eventId],
    queryFn: async () => {
      const response = await fetchWaitingListApi(eventId);
      return response.result;
    },
    enabled: eventId.length > 0,
    staleTime: 1000 * 30,
  });
}

/**
 * Mutation hook to accept or reject a join request.
 *
 * @param {string} eventId - Used to invalidate related queries on success.
 * @returns TanStack mutation object.
 */
export function useHandleJoinRequest(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation<
    { success: boolean; message?: string },
    Error,
    HandleJoinRequestParams
  >({
    mutationFn: handleJoinRequestApi,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["event", "waitingList", eventId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["event", "participants", eventId],
      });
    },
  });
}
