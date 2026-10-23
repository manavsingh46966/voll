import { apiClient } from "@/src/lib/axios";

import type {
  AddInstructionParams,
  EventDetailsResponse,
  EventItem,
  FindEventsRequest,
  FindEventsResponse,
  HandleJoinRequestParams,
  InstructionsResponse,
  JoinEventRequest,
  JoinEventResponse,
  ParticipantsResponse,
  PeopleSearchResponse,
  PostQnaMessageParams,
  PostQnaReplyParams,
  QnaResponse,
  WaitingListResponse,
} from "../types";

/* ── Internal normalizer ─────────────────────────── */

/**
 * Maps a raw new-backend event document to the canonical EventItem shape
 * used by frontend components, so component code stays unchanged.
 */
function normalizeEvent(raw: Record<string, unknown>): EventItem {
  const createdBy = raw.createdBy as
    | { _id?: unknown; id?: unknown; name?: string; email?: string }
    | undefined;

  const slots = Array.isArray(raw.slots)
    ? (raw.slots as Array<{
        slotId?: string;
        title?: string;
        startTime?: string;
        endTime?: string;
        maxParticipants?: number;
        currentParticipants?: number;
        skillGroups?: Array<{
          groupId?: string;
          title?: string;
          skills?: string[];
          maxParticipants?: number;
          currentParticipants?: number;
        }>;
      }>).map((s) => ({
        _id: s.slotId ?? "",
        title: s.title,
        startTime: s.startTime,
        endTime: s.endTime,
        maxSlotMembers: s.maxParticipants,
        capacity: s.maxParticipants,
        skillGroups: Array.isArray(s.skillGroups)
          ? s.skillGroups.map((g) => ({
              _id: g.groupId ?? "",
              title: g.title,
              requiredSkills: g.skills,
              maxGroupMembers: g.maxParticipants,
              capacity: g.maxParticipants,
            }))
          : undefined,
      }))
    : undefined;

  return {
    _id: String(raw._id ?? ""),
    eventId: raw.eventId as number | undefined,
    title: String(raw.title ?? ""),
    category: raw.category as string | undefined,
    categoryIcon: raw.categoryIcon as string | undefined,
    // Map coverPhotoUrl → photoURL so existing UI components work unchanged
    photoURL: (raw.coverPhotoUrl as string | undefined) ?? (raw.photoURL as string | undefined),
    description: raw.description as string | undefined,
    locationAddress: raw.locationAddress as EventItem["locationAddress"],
    fromDateTime: raw.fromDateTime ? new Date(raw.fromDateTime as string).toISOString() : undefined,
    toDateTime: raw.toDateTime ? new Date(raw.toDateTime as string).toISOString() : undefined,
    lastDateOfJoining: raw.lastDateToJoin
      ? new Date(raw.lastDateToJoin as string).toISOString()
      : undefined,
    createdBy: createdBy
      ? {
          // Map _id → userId so organizer checks work unchanged
          userId: String(createdBy._id ?? createdBy.id ?? ""),
          name: createdBy.name,
        }
      : undefined,
    numberOfVolunteers: (raw.numberOfVolunteers as number | undefined) ?? 0,
    reqMaxVolunteers: (raw.reqMaxVolunteers as number | undefined) ?? 0,
    reqMinVolunteers: (raw.reqMinVolunteers as number | undefined) ?? 0,
    skillsRequired: raw.skillsRequired as string[] | undefined,
    facilities: raw.facilities as string[] | undefined,
    visibility: raw.visibility as EventItem["visibility"],
    tags: raw.tags as string[] | undefined,
    photos: raw.photos as string[] | undefined,
    videos: raw.videos as string[] | undefined,
    timeSlotsGroup: slots,
    allowJoiningRequests: (raw.allowJoiningRequests as boolean | undefined) ?? false,
    isDeleted: (raw.isDeleted as boolean | undefined) ?? false,
    isJoined: (raw.isJoined as boolean | undefined) ?? false,
    isInterested: (raw.isInterested as boolean | undefined) ?? false,
    isPending: (raw.isPending as boolean | undefined) ?? false,
    interestedUsersCount: Array.isArray(raw.interestedUsers)
      ? (raw.interestedUsers as unknown[]).length
      : 0,
  };
}

/* ── Public API functions ────────────────────────── */

/**
 * Fetch paginated events from the backend.
 *
 * @endpoint GET /api/events
 * @param {FindEventsRequest} params - Optional search, category, cursor for pagination.
 * @returns {Promise<FindEventsResponse>} Event list.
 */
export const fetchEventsApi = async (
  params: FindEventsRequest,
): Promise<FindEventsResponse> => {
  const response = await apiClient.get<{ success: boolean; data: Record<string, unknown>[] }>(
    "/events",
    { params },
  );
  return {
    success: response.data.success,
    data: (response.data.data ?? []).map(normalizeEvent),
  };
};

/**
 * Fetch full details of a single event by its MongoDB ObjectId.
 *
 * @endpoint GET /api/events/:id
 * @param {string} eventId - MongoDB ObjectId string.
 * @returns {Promise<EventDetailsResponse>} Full event details.
 */
export const fetchEventDetailsApi = async (
  eventId: string,
): Promise<EventDetailsResponse> => {
  const response = await apiClient.get<{ success: boolean; data: Record<string, unknown> }>(
    `/events/${eventId}`,
  );
  return {
    success: response.data.success,
    data: normalizeEvent(response.data.data),
  };
};

/**
 * Send a join / request-to-join for an event.
 *
 * @endpoint POST /api/events/:id/join
 * @param {JoinEventRequest} params - eventId + optional slotId.
 * @returns {Promise<JoinEventResponse>} Success flag and status message.
 */
export const joinEventApi = async (
  params: JoinEventRequest,
): Promise<JoinEventResponse> => {
  const { eventId, slotId, skillGroupId } = params;
  const body: Record<string, string> = {};
  if (slotId) body.slotId = slotId;
  if (skillGroupId) body.skillGroupId = skillGroupId;
  const response = await apiClient.post<{
    success: boolean;
    data?: { status: string; message: string };
  }>(`/events/${eventId}/join`, body);
  return {
    success: response.data.success,
    message: response.data.data?.message ?? "",
  };
};

/**
 * Fetch registered volunteers for an event.
 *
 * @endpoint GET /api/events/:id/participants
 * @param {string} eventId - MongoDB ObjectId string.
 * @returns {Promise<ParticipantsResponse>} Normalized participant lists.
 */
export const fetchEventVolunteersApi = async (
  eventId: string,
): Promise<ParticipantsResponse> => {
  const response = await apiClient.get<{
    success: boolean;
    data: Array<{
      _id: unknown;
      name?: string;
      profileImageUrl?: string;
      city?: string;
      slotId?: string | null;
      skillGroupId?: string | null;
      slotTitle?: string | null;
      slotStartTime?: string | null;
      slotEndTime?: string | null;
    }>;
  }>(`/events/${eventId}/participants`);

  const registeredUsers = (response.data.data ?? []).map((u) => ({
    _id: String(u._id),
    name: u.name ?? "",
    profileImageUrl: u.profileImageUrl ?? "",
    location: u.city ?? "",
    slotId: u.slotId ?? null,
    skillGroupId: u.skillGroupId ?? null,
    slotTitle: u.slotTitle ?? null,
    slotStartTime: u.slotStartTime ?? null,
    slotEndTime: u.slotEndTime ?? null,
  }));

  return {
    success: response.data.success,
    result: { registeredUsers, interestedUsers: [] },
  };
};

/**
 * Fetch the pending join request list for an event (organizer only).
 *
 * @endpoint GET /api/events/:id/requests
 * @param {string} eventId - MongoDB ObjectId string.
 * @returns {Promise<WaitingListResponse>} Waiting users.
 */
export const fetchWaitingListApi = async (
  eventId: string,
): Promise<WaitingListResponse> => {
  const response = await apiClient.get<{
    success: boolean;
    data: Array<{ _id: unknown; name?: string; profileImageUrl?: string; city?: string }>;
  }>(`/events/${eventId}/requests`);

  const waiting = (response.data.data ?? []).map((u) => ({
    _id: String(u._id),
    name: u.name ?? "",
    profileImageUrl: u.profileImageUrl ?? "",
    location: u.city ?? "",
  }));

  return {
    success: response.data.success,
    result: { result: waiting, ev_id: eventId },
  };
};

/**
 * Approve or reject a join request.
 *
 * @endpoint POST /api/events/:id/requests/:userId/approve|reject
 * @param {HandleJoinRequestParams} params - eventId, userId, action.
 * @returns {Promise<{ success: boolean }>} Result.
 */
export const handleJoinRequestApi = async (
  params: HandleJoinRequestParams,
): Promise<{ success: boolean; message?: string }> => {
  const { eventId, userId, action } = params;
  const endpoint = action === "accept" ? "approve" : "reject";
  await apiClient.post(`/events/${eventId}/requests/${userId}/${endpoint}`);
  return { success: true };
};

/* ── Instructions ────────────────────────────────────
 * These endpoints are not yet implemented in new_backend.
 * The screens degrade gracefully to empty state.
 * ─────────────────────────────────────────────────── */

/**
 * @stub - Not available in new_backend yet.
 */
export const fetchInstructionsApi = async (
  _eventId: string,
): Promise<InstructionsResponse> => {
  return { success: true, instructions: [] };
};

/**
 * @stub - Not available in new_backend yet.
 */
export const addInstructionApi = async (
  _params: AddInstructionParams,
): Promise<{ success: boolean; message?: string }> => {
  return { success: false, message: "Instructions not yet supported." };
};

/* ── Q&A ─────────────────────────────────────────────
 * These endpoints are not yet implemented in new_backend.
 * The screens degrade gracefully to empty state.
 * ─────────────────────────────────────────────────── */

/**
 * @stub - Not available in new_backend yet.
 */
export const fetchEventQnaApi = async (
  _eventId: string,
): Promise<QnaResponse> => {
  return { success: true, result: { messages: [] } };
};

/**
 * @stub - Not available in new_backend yet.
 */
export const postQnaMessageApi = async (
  _params: PostQnaMessageParams,
): Promise<{ success: boolean; message?: string }> => {
  return { success: false, message: "Q&A not yet supported." };
};

/**
 * @stub - Not available in new_backend yet.
 */
export const postQnaReplyApi = async (
  _params: PostQnaReplyParams,
): Promise<{ success: boolean; message?: string }> => {
  return { success: false, message: "Q&A not yet supported." };
};

/**
/**
 * Toggle the current user's interest in an event.
 *
 * @endpoint POST /api/events/:id/interest
 * @param {string} eventId - MongoDB ObjectId string.
 * @returns {Promise<{ success: boolean }>} Result.
 */
export const toggleInterestApi = async (
  eventId: string,
): Promise<{ success: boolean }> => {
  await apiClient.post(`/events/${eventId}/interest`);
  return { success: true };
};

/**
 * Search for people by name or email.
 *
 * @endpoint GET /api/events/search-people?q=query
 * @param {string} query - Search string.
 * @returns {Promise<PeopleSearchResponse>} Matching users.
 */
export const fetchPeopleSearchApi = async (
  query: string,
): Promise<PeopleSearchResponse> => {
  const response = await apiClient.get<{ success: boolean; data: unknown[] }>(
    "/events/search-people",
    { params: { q: query } },
  );
  return {
    success: response.data.success,
    data: (response.data.data ?? []).map((u: any) => ({
      _id: String(u._id ?? ""),
      name: u.name,
      email: u.email,
      profileImageUrl: u.profileImageUrl,
    })),
  };
};
