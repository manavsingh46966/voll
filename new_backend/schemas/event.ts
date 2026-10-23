import { z } from 'zod';

const LocationSchema = z.object({
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  address: z.string().trim().max(500).optional(),
  name: z.string().trim().max(200).optional(),
  placeId: z.string().trim().max(500).optional(),
});

const SlotSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(1).max(200),
  startTime: z.string(),
  endTime: z.string(),
  minParticipants: z.coerce.number().int().min(0).optional(),
  maxParticipants: z.coerce.number().int().min(0).optional(),
});

const SkillGroupSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(1).max(200),
  skills: z.array(z.string()).optional(),
  minParticipants: z.coerce.number().int().min(0).optional(),
  maxParticipants: z.coerce.number().int().min(0).optional(),
});

const RecurrenceSchema = z.object({
  interval: z.coerce.number().int().min(1).optional(),
  unit: z.enum(['day', 'week', 'month', 'year', '']).optional(),
  repeatOn: z.array(z.string()).optional(),
  endCondition: z.enum(['never', 'onDate', 'afterOccurrences']).optional(),
  endDate: z.string().optional(),
  occurrences: z.coerce.number().int().min(1).optional(),
});

export const CreateEventSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5000).optional(),
  category: z.string().trim().max(100).optional(),
  categoryIcon: z.string().trim().max(500).optional(),
  coverPhotoUrl: z.string().max(2000).optional(),
  locationType: z.enum(['physical', 'virtual', 'hybrid']).optional(),
  locationAddress: LocationSchema.optional(),
  locationCity: z.string().trim().max(200).optional(),
  virtualLink: z.string().trim().max(2000).optional(),
  fromDateTime: z.string(),
  toDateTime: z.string().optional(),
  lastDateToJoin: z.string().optional(),
  timeZone: z.object({ value: z.string(), shortform: z.string() }).optional(),
  reqMinVolunteers: z.coerce.number().int().min(0).optional(),
  reqMaxVolunteers: z.coerce.number().int().min(0).optional(),
  skillsRequired: z.array(z.string()).optional(),
  facilities: z.array(z.string()).optional(),
  visibility: z.string().optional(),
  isRecurring: z.boolean().optional(),
  recurrence: RecurrenceSchema.optional(),
  slots: z.array(SlotSchema).optional(),
  skillGroups: z.array(SkillGroupSchema).optional(),
  tags: z.array(z.string()).optional(),
  allowJoiningRequests: z.boolean().optional(),
  photos: z.array(z.string()).optional(),
  videos: z.array(z.string()).optional(),
});

export const UpdateEventSchema = CreateEventSchema.partial().extend({
  status: z.enum(['draft', 'published', 'cancelled', 'completed']).optional(),
});

export const EventsQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
  search: z.string().trim().max(200).optional(),
  category: z.string().trim().max(100).optional(),
  locationType: z.enum(['physical', 'virtual', 'hybrid']).optional(),
  joinedOnly: z.preprocess((val) => val === 'true' || val === true, z.boolean()).optional(),
  organizerId: z.string().optional(),
});

export type CreateEvent = z.infer<typeof CreateEventSchema>;
export type UpdateEvent = z.infer<typeof UpdateEventSchema>;
export type EventsQuery = z.infer<typeof EventsQuerySchema>;
