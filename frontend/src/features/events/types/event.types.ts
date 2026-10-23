/**
 * Core event type matching the backend Event model shape.
 * Used across the events feature for type safety.
 */
export interface EventItem {
  _id: string;
  eventId?: number;
  title: string;
  category?: string;
  categoryIcon?: string;
  photoURL?: string;
  description?: string;
  locationAddress?:
    | string
    | {
        latitude?: number;
        longitude?: number;
        address?: string;
        name?: string;
        placeId?: string;
      };
  fromDateTime?: string;
  toDateTime?: string;
  lastDateOfJoining?: string;
  createdBy?: {
    userId: string;
    name?: string;
  };
  numberOfVolunteers?: number;
  reqMaxVolunteers?: number;
  reqMinVolunteers?: number;
  skillsRequired?: string[];
  facilities?: string[];
  visibility?: "public" | "followers" | "byInvite";
  tags?: string[];
  photos?: string[];
  videos?: string[];
  timeSlotsGroup?: TimeSlot[];
  skillsGroup?: SkillGroup[];
  allowJoiningRequests?: boolean;
  isDeleted?: boolean;
  isJoined?: boolean;
  isInterested?: boolean;
  isPending?: boolean;
  /** Count of users who marked themselves as interested. Derived from backend interestedUsers array. */
  interestedUsersCount?: number;
}

/**
 * Time slot within an event.
 */
export interface TimeSlot {
  _id?: string;
  title?: string;
  startTime?: string;
  endTime?: string;
  minSlotMembers?: number;
  maxSlotMembers?: number;
  capacity?: number;
  userDetails?: { userId: string }[];
  /** Skill groups nested inside this slot (new backend format). */
  skillGroups?: SkillGroup[];
}

/**
 * Skill group within an event.
 */
export interface SkillGroup {
  _id?: string;
  title?: string;
  minGroupMembers?: number;
  maxGroupMembers?: number;
  capacity?: number;
  requiredSkills?: string[];
  userDetails?: { userId: string }[];
}

/**
 * Response shape from GET /api/events/:id
 */
export interface EventDetailsResponse {
  success: boolean;
  data: EventItem;
}

/**
 * Request body for POST /api/events/:id/join
 */
export interface JoinEventRequest {
  /** MongoDB ObjectId string of the event */
  eventId: string;
  /** Optional slot ID for slotted events */
  slotId?: string;
  /** Optional skill group ID within the slot */
  skillGroupId?: string;
}

/**
 * Response shape from POST /api/events/:id/join
 */
export interface JoinEventResponse {
  success: boolean;
  message: string;
}

/**
 * Response shape from GET /api/events
 */
export interface FindEventsResponse {
  success: boolean;
  data: EventItem[];
}

/**
 * Query params for GET /api/events
 */
export interface FindEventsRequest {
  search?: string;
  category?: string;
  locationType?: "physical" | "virtual" | "hybrid";
  /** ISO date string cursor for pagination */
  cursor?: string;
  limit?: number;
  joinedOnly?: boolean;
  organizerId?: string;
}

/* ── Participants ─────────────────────────────────── */

export interface Participant {
  /** MongoDB ObjectId string */
  _id: string;
  name?: string;
  profileImageUrl?: string;
  location?: string;
  /** Slot the participant registered for (null if no slot was required). */
  slotId?: string | null;
  skillGroupId?: string | null;
  slotTitle?: string | null;
  slotStartTime?: string | null;
  slotEndTime?: string | null;
}

export interface ParticipantsResponse {
  success: boolean;
  result: {
    registeredUsers: Participant[];
    interestedUsers: Participant[];
  };
}

/* ── Join Requests ─────────────────────────────────── */

export interface WaitingUser {
  /** MongoDB ObjectId string */
  _id: string;
  name?: string;
  profileImageUrl?: string;
  location?: string;
  /** Title of the slot the user requested (null if no slot was required). */
  slotTitle?: string | null;
}

export interface WaitingListResponse {
  success: boolean;
  result: {
    result: WaitingUser[];
    ev_id: string;
  };
}

export interface HandleJoinRequestParams {
  /** MongoDB ObjectId string of the event */
  eventId: string;
  /** MongoDB ObjectId string of the user */
  userId: string;
  action: "accept" | "reject";
}

/* ── Instructions ─────────────────────────────────── */

export interface EventInstruction {
  msg_id?: string;
  authorId?: number;
  message: string;
  createdAt: string | Date;
  attachments?: { data: string; contentType: string; filename: string }[];
}

export interface InstructionsResponse {
  success: boolean;
  instructions?: EventInstruction[];
  result?: EventInstruction[];
}

export interface AddInstructionParams {
  eventId: string;
  ev_id: string;
  message: string;
}

/* ── Q&A ──────────────────────────────────────────── */

export interface QnaReply {
  _id: string;
  authorId: number;
  authorName: string;
  authorPhoto: string;
  taggedId: number | null;
  taggedName: string | null;
  content: string;
  timeSent: string | Date;
}

export interface QnaMessage {
  _id: string;
  authorId: number;
  authorName: string;
  authorPhoto: string;
  content: string;
  timeSent: string | Date;
  replies: QnaReply[];
}

export interface QnaResponse {
  success: boolean;
  result: { messages: QnaMessage[] };
}

export interface PostQnaMessageParams {
  eventId: string;
  authorId: number;
  content: string;
}

export interface PostQnaReplyParams {
  eventId: string;
  messageId: string;
  authorId: number;
  taggedId: number | null;
  content: string;
}

/* ── People Search ─────────────────────────────────── */

export interface Person {
  _id: string;
  name?: string;
  email?: string;
  profileImageUrl?: string;
}

export interface PeopleSearchResponse {
  success: boolean;
  data: Person[];
}
