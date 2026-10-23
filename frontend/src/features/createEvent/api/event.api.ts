import { apiClient } from "@/src/lib/axios";

import type {
  CreateEventFormData,
  Event,
  EventsQueryParams,
  Person,
} from "../types/event.types";
import {
  deriveEventCapacity,
  withDerivedSlotCapacity,
} from "../utils/capacity";

/**
 * Fetches the paginated event feed matching the specified query parameters.
 * Supports cursor-based pagination, search query terms, category filtering,
 * and filtering by location type (virtual, physical, hybrid).
 *
 * @param {EventsQueryParams} params - The query parameters for filtering the events feed.
 * @param {string} [params.cursor] - The pagination cursor matching the fromDateTime of the last loaded event.
 * @param {number} [params.limit] - The maximum number of events to return per page.
 * @param {string} [params.search] - The search query term matching event titles or descriptions.
 * @param {string} [params.category] - Filter events by category name.
 * @param {string} [params.locationType] - Filter by 'physical', 'virtual', or 'hybrid'.
 * @returns {Promise<Event[]>} A promise that resolves to the array of fetched events.
 */
export const fetchEventsFeedApi = async (
  params: EventsQueryParams,
): Promise<Event[]> => {
  const response = await apiClient.get<{ success: boolean; data: Event[] }>("/events", { params });
  return response.data.data ?? [];
};

/**
 * Fetches a list of all events currently pending approval from platform superadmins.
 * Only events with status "pending_approval" will be returned. This is typically used
 * in the admin moderation dashboard.
 *
 * @returns {Promise<Event[]>} A promise resolving to the list of pending events.
 */
export const fetchPendingApprovalEventsApi = async (): Promise<Event[]> => {
  const response = await apiClient.get<{ success: boolean; data: Event[] }>(
    "/events/pending-approval",
  );
  return response.data.data ?? [];
};

/**
 * Approves an event that is currently pending approval.
 * Updates the status of the target event to "published" and makes it visible
 * on the public feed.
 *
 * @param {string} id - The unique MongoDB ObjectId of the target event.
 * @returns {Promise<Event>} A promise resolving to the updated event details.
 */
export const approveEventApi = async (id: string): Promise<Event> => {
  const response = await apiClient.patch<{ success: boolean; data: Event }>(
    `/events/${id}/approve`,
  );
  return response.data.data;
};

/**
 * Fetches the detailed information of a single event by its unique ID.
 * Retrieves all fields including time slots, organizer details, and participation parameters.
 *
 * @param {string} id - The unique MongoDB ObjectId of the target event.
 * @returns {Promise<Event>} A promise resolving to the detailed event object.
 */
export const fetchEventByIdApi = async (id: string): Promise<Event> => {
  const response = await apiClient.get<{ success: boolean; data: Event }>(`/events/${id}`);
  return response.data.data;
};

/**
 * Joins a specific event (or a specific time slot/skill group within it).
 *
 * @param {string} id - The unique MongoDB ObjectId of the target event.
 * @param {object} [options] - Optional configurations for joining specific subsets.
 * @param {string} [options.slotId] - The specific time slot ID the volunteer wants to join.
 * @param {string} [options.skillGroupId] - The specific skill group ID the volunteer wants to fill.
 * @returns {Promise<{ status: string; message: string }>} A promise resolving to the join result status.
 */
export const joinEventApi = async (
  id: string,
  options?: { slotId?: string; skillGroupId?: string },
): Promise<{ status: string; message: string }> => {
  const response = await apiClient.post(`/events/${id}/join`, options ?? {});
  return response.data;
};

/**
 * Leaves an event that the authenticated user has previously joined.
 * Removes the user from the participants list of the event and any assigned slots.
 *
 * @param {string} id - The unique MongoDB ObjectId of the target event.
 * @returns {Promise<void>} A promise resolving when the user has successfully left the event.
 */
export const leaveEventApi = async (id: string): Promise<void> => {
  await apiClient.post(`/events/${id}/leave`);
};

/**
 * Toggles the authenticated user's interested status for the target event.
 * Adds or removes the user from the event's interest list.
 *
 * @param {string} id - The unique MongoDB ObjectId of the target event.
 * @returns {Promise<{ isInterested: boolean }>} A promise resolving to the new interest state.
 */
export const toggleInterestApi = async (
  id: string,
): Promise<{ isInterested: boolean }> => {
  const response = await apiClient.post<{ success: boolean; data: { isInterested: boolean } }>(
    `/events/${id}/interest`,
  );
  return response.data.data;
};

/**
 * Retrieves the list of approved participants for a given event.
 *
 * @param {string} id - The unique MongoDB ObjectId of the event.
 * @returns {Promise<Person[]>} A promise resolving to an array of approved participants.
 */
export const fetchParticipantsApi = async (id: string): Promise<Person[]> => {
  const response = await apiClient.get<{ success: boolean; data: Person[] }>(`/events/${id}/participants`);
  return response.data.data ?? [];
};

/**
 * Retrieves the list of users who have requested to join the event but are pending approval.
 * Only relevant for events where `allowJoiningRequests` is true.
 *
 * @param {string} id - The unique MongoDB ObjectId of the event.
 * @returns {Promise<Person[]>} A promise resolving to an array of pending requesters.
 */
export const fetchPendingRequestsApi = async (
  id: string,
): Promise<Person[]> => {
  const response = await apiClient.get<{ success: boolean; data: Person[] }>(`/events/${id}/requests`);
  return response.data.data ?? [];
};

/**
 * Approves a user's request to join an event.
 *
 * @param {string} eventId - The unique MongoDB ObjectId of the event.
 * @param {string} userId - The unique MongoDB ObjectId of the user being approved.
 * @returns {Promise<void>} A promise that resolves once the approval has been processed.
 */
export const approveRequestApi = async (
  eventId: string,
  userId: string,
): Promise<void> => {
  await apiClient.post(`/events/${eventId}/requests/${userId}/approve`);
};

/**
 * Rejects a user's request to join an event.
 *
 * @param {string} eventId - The unique MongoDB ObjectId of the event.
 * @param {string} userId - The unique MongoDB ObjectId of the user being rejected.
 * @returns {Promise<void>} A promise that resolves once the rejection has been processed.
 */
export const rejectRequestApi = async (
  eventId: string,
  userId: string,
): Promise<void> => {
  await apiClient.post(`/events/${eventId}/requests/${userId}/reject`);
};

/**
 * Searches for people/users across the platform matching the search query string.
 * Used in user mentions, invites, and search inputs.
 *
 * @param {string} q - The search text matching user name or email.
 * @returns {Promise<Person[]>} A promise resolving to the list of matching users.
 */
export const searchPeopleApi = async (q: string): Promise<Person[]> => {
  const response = await apiClient.get<{ success: boolean; data: Person[] }>("/events/search-people", {
    params: { q },
  });
  return response.data.data ?? [];
};

/**
 * Requests an S3 upload presigned URL from the backend.
 * Provides the public URL where the file will be hosted after uploading, and the file key.
 *
 * @param {string} fileName - The raw name of the file to be uploaded.
 * @param {string} contentType - The MIME type of the file (e.g. image/jpeg, image/png).
 * @returns {Promise<{ presignedUrl: string; publicUrl: string; key: string }>} Presigned upload details.
 */
export const getS3PresignedUrl = async (
  fileName: string,
  contentType: string,
): Promise<{ presignedUrl: string; publicUrl: string; key: string }> => {
  const response = await apiClient.get("/s3/presigned-url", {
    params: { fileName, contentType },
  });
  return response.data;
};

/**
 * Uploads a file blob directly to AWS S3 using a generated presigned URL.
 *
 * @param {string} presignedUrl - The presigned PUT URL generated by the backend.
 * @param {Blob} file - The file blob/data to upload.
 * @param {string} contentType - The MIME type of the file.
 * @returns {Promise<void>} A promise that resolves when the upload completes.
 */
export const uploadFileToS3 = async (
  presignedUrl: string,
  file: Blob,
  contentType: string,
): Promise<void> => {
  await fetch(presignedUrl, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: file,
  });
};

/**
 * Maps frontend event creation form data state into a backend-compatible API payload.
 * Evaluates capacity thresholds and skill groups configurations based on whether slots exist.
 *
 * @param {CreateEventFormData} form - The raw form input state from the multi-step wizard.
 * @returns {object} The normalized JSON payload payload for the backend POST /events request.
 */
function mapFormDataToPayload(form: CreateEventFormData) {
  const derived = deriveEventCapacity(form);
  const slots = form.slots?.map(withDerivedSlotCapacity) ?? [];
  const eventSkillGroups = slots.length > 0 ? [] : (form.skillGroups ?? []);

  let locationAddress: any = undefined;
  if (!form.isVirtual && form.location) {
    const { address, name, placeId, latitude, longitude } = form.location;
    if (address || name || placeId || latitude || longitude) {
      locationAddress = {
        latitude: typeof latitude === "number" && !isNaN(latitude) ? latitude : undefined,
        longitude: typeof longitude === "number" && !isNaN(longitude) ? longitude : undefined,
        address: address ? address.slice(0, 500) : undefined,
        name: name ? name.slice(0, 200) : undefined,
        placeId: placeId ? placeId.slice(0, 500) : undefined,
      };
    }
  }

  const minVolunteers =
    form.minParticipants > 0 ? form.minParticipants : derived.minParticipants;
  const maxVolunteers =
    form.maxParticipants > 0 ? form.maxParticipants : derived.maxParticipants;
  const skillsRequired =
    form.skills && form.skills.length > 0 ? form.skills : derived.skills;

  return {
    title: form.title.trim(),
    description: form.description?.trim() || undefined,
    category: form.category?.trim() || undefined,
    tags: form.tags ?? [],
    coverPhotoUrl: form.coverPhotoUrl || undefined,
    locationType: form.isVirtual ? "virtual" : "physical",
    locationAddress,
    locationCity: form.city?.trim() || undefined,
    virtualLink: form.isVirtual ? form.virtualLink?.trim() || undefined : undefined,
    fromDateTime: form.startDate,
    toDateTime: form.endDate || undefined,
    lastDateToJoin: form.lastDateToJoin || undefined,
    timeZone: form.timeZone,
    reqMinVolunteers: minVolunteers || 0,
    reqMaxVolunteers: maxVolunteers || 0,
    skillsRequired: skillsRequired ?? [],
    facilities: form.perks ?? [],
    visibility: form.visibility || "public",
    allowedGroups: form.allowedGroups ?? [],
    isRecurring: !!form.isRecurring,
    recurrence: form.isRecurring ? form.recurrence : undefined,
    slots: slots.map((s) => ({
      id: s.id,
      title: s.title,
      startTime: s.startTime,
      endTime: s.endTime,
      minParticipants: s.minParticipants || 0,
      maxParticipants: s.maxParticipants || 0,
      skillGroups: (s.skillGroups ?? []).map((g) => ({
        id: g.id,
        title: g.title,
        skills: g.skills ?? [],
        minParticipants: g.minParticipants || 0,
        maxParticipants: g.maxParticipants || 0,
      })),
    })),
    skillGroups: eventSkillGroups.map((g) => ({
      id: g.id,
      title: g.title,
      skills: g.skills ?? [],
      minParticipants: g.minParticipants || 0,
      maxParticipants: g.maxParticipants || 0,
    })),
    allowJoiningRequests: !!form.allowJoiningRequests,
    photos: form.photos ?? [],
    videos: form.videoLinks ?? [],
  };
}

/**
 * Submits the event creation request to the backend.
 * Pre-processes form parameters (timezones, locations, custom capacities) using mapFormDataToPayload.
 *
 * @param {CreateEventFormData} form - The raw form input state from the multi-step wizard.
 * @returns {Promise<Event>} A promise resolving to the created Event details.
 */
export const createEventApi = async (
  form: CreateEventFormData,
): Promise<Event> => {
  const payload = mapFormDataToPayload(form);
  const response = await apiClient.post<{ success: boolean; data: Event }>("/events", payload);
  return response.data.data;
};
