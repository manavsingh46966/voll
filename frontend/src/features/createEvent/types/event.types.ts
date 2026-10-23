/**
 * Represents the type of location where the event takes place.
 * * `physical`: Takes place at a physical geographic location.
 * * `virtual`: Held online (has a virtual link).
 * * `hybrid`: Both in-person and online components.
 */
export type EventLocationType = "physical" | "virtual" | "hybrid";

/**
 * Standard status states of an Event.
 * * `draft`: Event is a draft and not published.
 * * `published`: Event is live and visible on feeds.
 * * `cancelled`: Event was cancelled by the organizer.
 * * `completed`: Event datetime has passed and is complete.
 */
export type EventStatus = "draft" | "published" | "cancelled" | "completed";

/**
 * Represents the basic organizer info of an event creator.
 */
export interface EventOrganizer {
  /** The unique MongoDB ObjectId of the organizer user. */
  _id: string;
  /** Display name of the organizer. */
  name?: string;
}

/**
 * Structure of a physical address location, typically resolved via Google Places API.
 */
export interface EventLocation {
  /** GPS latitude coordinate. */
  latitude?: number;
  /** GPS longitude coordinate. */
  longitude?: number;
  /** Complete human-readable street address. */
  address?: string;
  /** Display/business name of the place. */
  name?: string;
  /** Google Places unique place identifier. */
  placeId?: string;
}

/**
 * Interface representing the comprehensive Domain Model of an Event.
 */
export interface Event {
  /** Unique MongoDB identifier for the event. */
  _id: string;
  /** The title/name of the event. */
  title: string;
  /** Optional category category group. */
  category?: string;
  /** Optional icon name representing the category. */
  categoryIcon?: string;
  /** Optional header banner cover image URL. */
  coverPhotoUrl?: string;
  /** The geographic/virtual hosting location type. */
  locationType: EventLocationType;
  /** Address details (either structured EventLocation or simple string). */
  locationAddress?: EventLocation | string;
  /** Optional city name representing the event location. */
  locationCity?: string;
  /** Direct link for online meetings (e.g. Google Meet, Zoom link). */
  virtualLink?: string;
  /** Start date and time of the event in ISO format. */
  fromDateTime: string;
  /** End date and time of the event in ISO format. */
  toDateTime?: string;
  /** Registration closing date/time threshold. */
  lastDateToJoin?: string;
  /** Current count of participants who joined the event. */
  numberOfVolunteers: number;
  /** Derived minimum volunteers required for the event to succeed. */
  reqMinVolunteers?: number;
  /** Derived maximum volunteers allowed (capacity ceiling). */
  reqMaxVolunteers: number;
  /** Skills required from volunteers. */
  skillsRequired?: string[];
  /** Perks/facilities provided to participants (e.g. food, transport, certificate). */
  facilities?: string[];
  /** Categorized keywords/tags for discoverability. */
  tags?: string[];
  /** Markdown/text body description of the event details. */
  description?: string;
  /** Event visibility tier ('public', 'private', 'group'). */
  visibility?: string;
  /** Array of group IDs allowed to view/join if visibility is group-restricted. */
  allowedGroups?: string[];
  /** True if the user's join request requires organizer approval first. */
  allowJoiningRequests?: boolean;
  /** True if the event supports choosing distinct sub-slots. */
  allowMultipleSlots?: boolean;
  /** The list of time slots defining the sub-sessions. */
  slots?: TimeSlot[];
  /** The list of skill groups defining capacity constraints by role. */
  skillGroups?: SkillGroup[];
  /** True if this is a recurring template event. */
  isRecurring?: boolean;
  /** Optional reference to parent event if this is a recurring instance. */
  parentEventId?: string;
  /** Current approval/lifecycle state of the event. */
  status: EventStatus | "pending_approval";
  /** Reference details of the user who created this event. */
  createdBy: EventOrganizer;
  /** Contextual flag: true if the current user is a participant. */
  isJoined?: boolean;
  /** Contextual flag: true if the current user's join request is pending approval. */
  isPending?: boolean;
  /** Contextual flag: true if the current user has bookmarked/interested the event. */
  isInterested?: boolean;
  /** True if the event is soft-deleted. */
  isDeleted?: boolean;
  /** Event creation timestamp. */
  createdAt: string;
  /** Last updated timestamp. */
  updatedAt: string;
}

/**
 * Supported query parameters for retrieving lists of events.
 */
export interface EventsQueryParams {
  /** Page cursor representation (usually fromDateTime timestamp). */
  cursor?: string;
  /** Max records limit per page. */
  limit?: number;
  /** Text search matching titles/descriptions. */
  search?: string;
  /** Event category name. */
  category?: string;
  /** Filter by location type. */
  locationType?: EventLocationType;
}

/**
 * Basic details of a user participant.
 */
export interface Person {
  /** Unique MongoDB user ID. */
  _id: string;
  /** Display name of the user. */
  name?: string;
  /** Registered email address of the user. */
  email: string;
}

/**
 * Time Slot representing a structured shift or sub-event.
 */
export interface TimeSlot {
  /** Unique client/server identifier for the slot. */
  id: string;
  /** Display name/title of the slot shift. */
  title: string;
  /** Start time of the slot in ISO format. */
  startTime: string;
  /** End time of the slot in ISO format. */
  endTime: string;
  /** Minimum required participants for this slot. */
  minParticipants: number;
  /** Maximum capacity for this slot. */
  maxParticipants: number;
  /** Specific skill group capacity targets under this slot. */
  skillGroups: SkillGroup[];
}

/**
 * Skill Group allocating capacity slots to specific professional skills.
 */
export interface SkillGroup {
  /** Unique client/server identifier for the group. */
  id: string;
  /** Display name (e.g. "Medical Support", "Event Photographer"). */
  title: string;
  /** List of required skills associated with this group. */
  skills: string[];
  /** Minimum required people for this skill subset. */
  minParticipants: number;
  /** Maximum capacity for this skill subset. */
  maxParticipants: number;
}

/**
 * Helper container representing calculated aggregate capacity fields.
 */
export interface DerivedCapacity {
  /** Summed min capacity across slots/skill groups. */
  minParticipants: number;
  /** Summed max capacity across slots/skill groups. */
  maxParticipants: number;
  /** Unique union array of required skills. */
  skills: string[];
}

/**
 * Configuration options for recurring events templates.
 */
export interface RecurrenceData {
  /** Frequency interval value. */
  interval: number;
  /** Recurrence period type. */
  unit: "" | "day" | "week" | "month" | "year";
  /** Days of the week to repeat on (e.g. `['monday', 'wednesday']`). */
  repeatOn?: string[];
  /** Exit threshold type. */
  endCondition: "never" | "onDate" | "afterOccurrences";
  /** Ending threshold date. */
  endDate?: string;
  /** Ending threshold occurrences count limit. */
  occurrences?: number;
}

/**
 * Form input state container for the Multi-Step Create Event Flow.
 */
export interface CreateEventFormData {
  /** Event title. */
  title: string;
  /** Detailed descriptions. */
  description: string;
  /** Chosen event category. */
  category: string;
  /** Keywords/tags. */
  tags: string[];
  /** Structured location coordinates/address. */
  location: EventLocation;
  /** True if the event is virtual. */
  isVirtual: boolean;
  /** Virtual conferencing link. */
  virtualLink: string;
  /** City name. */
  city: string;
  /** Public URL of the selected cover header. */
  coverPhotoUrl: string;
  /** Local base64 string of selected cover (prior to uploading). */
  coverPhotoBase64?: string;
  /** Event start date time (ISO string). */
  startDate: string;
  /** Event end date time (ISO string). */
  endDate: string;
  /** Last threshold date to join (ISO string). */
  lastDateToJoin: string;
  /** User-defined timezone object. */
  timeZone: { value: string; shortform: string };
  /** True if configured as a recurring template. */
  isRecurring: boolean;
  /** Recurrence schema details. */
  recurrence?: RecurrenceData;
  /** Sub-slots list. */
  slots: TimeSlot[];
  /** Fallback minimum volunteers count (when no slots/skill groups exist). */
  minParticipants: number;
  /** Fallback maximum volunteers capacity (when no slots/skill groups exist). */
  maxParticipants: number;
  /** Fallback list of required skills. */
  skills: string[];
  /** Fallback list of skill groups (when no sub-slots exist). */
  skillGroups: SkillGroup[];
  /** Perks/facilities provided. */
  perks: string[];
  /** Visibility tier. */
  visibility: string;
  /** Restricting groups list. */
  allowedGroups: string[];
  /** Requires join verification check. */
  allowJoiningRequests: boolean;
  /** Additional secondary photo URLs. */
  photos: string[];
  /** External media video links. */
  videoLinks: string[];
}

/**
 * Initial empty template state matching the CreateEventFormData structure.
 */
export const initialCreateEventFormData: CreateEventFormData = {
  title: "",
  description: "",
  category: "",
  tags: [],
  location: { latitude: 0, longitude: 0, address: "", placeId: "", name: "" },
  isVirtual: false,
  virtualLink: "",
  city: "",
  coverPhotoUrl: "",
  startDate: "",
  endDate: "",
  lastDateToJoin: "",
  timeZone: { value: "Asia/Kolkata", shortform: "IST" },
  isRecurring: false,
  recurrence: undefined,
  slots: [],
  minParticipants: 0,
  maxParticipants: 0,
  skills: [],
  skillGroups: [],
  perks: [],
  visibility: "public",
  allowedGroups: [],
  allowJoiningRequests: false,
  photos: [],
  videoLinks: [],
};
