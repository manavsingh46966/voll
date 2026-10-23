import { type Request, type Response } from 'express';
import { ObjectIdSchema } from '../schemas/common.ts';
import { CreateEventSchema, UpdateEventSchema, EventsQuerySchema } from '../schemas/event.ts';
import {
  approveEvent,
  approveRequest,
  createEvent,
  deleteEvent,
  getEventById,
  getEvents,
  getParticipants,
  getPendingApprovalEvents,
  getPendingRequests,
  joinEvent,
  leaveEvent,
  rejectRequest,
  searchPeople,
  toggleInterest,
  updateEvent,
} from '../services/event/eventService.ts';
import { sendError, sendResult } from '../utils/http.ts';
import { catchAsync } from '../utils/catchAsync.ts';

export const getEventsHandler = catchAsync(async (req: Request, res: Response) => {
  const validation = EventsQuerySchema.safeParse(req.query);
  if (!validation.success) {
    sendError(res, 400, 'BAD_REQUEST', 'Invalid query parameters.', validation.error.flatten());
    return;
  }
  const result = await getEvents(validation.data, req.user?.id);
  sendResult(res, result);
});

export const getEventByIdHandler = catchAsync(async (req: Request, res: Response) => {
  const idValidation = ObjectIdSchema.safeParse(req.params.id);
  if (!idValidation.success) {
    sendError(res, 400, 'BAD_REQUEST', 'Invalid event id.');
    return;
  }
  const result = await getEventById(idValidation.data, req.user?.id);
  sendResult(res, result);
});

export const createEventHandler = catchAsync(async (req: Request, res: Response) => {
  const validation = CreateEventSchema.safeParse(req.body);
  if (!validation.success) {
    sendError(res, 400, 'BAD_REQUEST', 'Invalid event payload.', validation.error.flatten());
    return;
  }
  const result = await createEvent(req.user!.id, validation.data);
  sendResult(res, result, 201);
});

export const updateEventHandler = catchAsync(async (req: Request, res: Response) => {
  const idValidation = ObjectIdSchema.safeParse(req.params.id);
  if (!idValidation.success) {
    sendError(res, 400, 'BAD_REQUEST', 'Invalid event id.');
    return;
  }
  const validation = UpdateEventSchema.safeParse(req.body);
  if (!validation.success) {
    sendError(res, 400, 'BAD_REQUEST', 'Invalid event update payload.', validation.error.flatten());
    return;
  }
  const result = await updateEvent(idValidation.data, req.user!.id, validation.data);
  sendResult(res, result);
});

export const approveEventHandler = catchAsync(async (req: Request, res: Response) => {
  const idValidation = ObjectIdSchema.safeParse(req.params.id);
  if (!idValidation.success) {
    sendError(res, 400, 'BAD_REQUEST', 'Invalid event id.');
    return;
  }
  const result = await approveEvent(idValidation.data, req.user!);
  sendResult(res, result);
});

export const getPendingApprovalEventsHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await getPendingApprovalEvents(req.user!);
  sendResult(res, result);
});

export const deleteEventHandler = catchAsync(async (req: Request, res: Response) => {
  const idValidation = ObjectIdSchema.safeParse(req.params.id);
  if (!idValidation.success) {
    sendError(res, 400, 'BAD_REQUEST', 'Invalid event id.');
    return;
  }
  const result = await deleteEvent(idValidation.data, req.user!.id);
  if (result.success) {
    res.status(204).send();
  } else {
    sendResult(res, result);
  }
});

export const joinEventHandler = catchAsync(async (req: Request, res: Response) => {
  const idValidation = ObjectIdSchema.safeParse(req.params.id);
  if (!idValidation.success) {
    sendError(res, 400, 'BAD_REQUEST', 'Invalid event id.');
    return;
  }
  const slotId = typeof req.body?.slotId === 'string' ? req.body.slotId : undefined;
  const result = await joinEvent(idValidation.data, req.user!.id, slotId);
  sendResult(res, result);
});

export const leaveEventHandler = catchAsync(async (req: Request, res: Response) => {
  const idValidation = ObjectIdSchema.safeParse(req.params.id);
  if (!idValidation.success) {
    sendError(res, 400, 'BAD_REQUEST', 'Invalid event id.');
    return;
  }
  const result = await leaveEvent(idValidation.data, req.user!.id);
  if (result.success) {
    res.status(204).send();
  } else {
    sendResult(res, result);
  }
});

export const toggleInterestHandler = catchAsync(async (req: Request, res: Response) => {
  const idValidation = ObjectIdSchema.safeParse(req.params.id);
  if (!idValidation.success) {
    sendError(res, 400, 'BAD_REQUEST', 'Invalid event id.');
    return;
  }
  const result = await toggleInterest(idValidation.data, req.user!.id);
  sendResult(res, result);
});

export const getParticipantsHandler = catchAsync(async (req: Request, res: Response) => {
  const idValidation = ObjectIdSchema.safeParse(req.params.id);
  if (!idValidation.success) {
    sendError(res, 400, 'BAD_REQUEST', 'Invalid event id.');
    return;
  }
  const result = await getParticipants(idValidation.data);
  sendResult(res, result);
});

export const getPendingRequestsHandler = catchAsync(async (req: Request, res: Response) => {
  const idValidation = ObjectIdSchema.safeParse(req.params.id);
  if (!idValidation.success) {
    sendError(res, 400, 'BAD_REQUEST', 'Invalid event id.');
    return;
  }
  const result = await getPendingRequests(idValidation.data, req.user!.id);
  sendResult(res, result);
});

export const approveRequestHandler = catchAsync(async (req: Request, res: Response) => {
  const idValidation = ObjectIdSchema.safeParse(req.params.id);
  const targetValidation = ObjectIdSchema.safeParse(req.params.userId);
  if (!idValidation.success || !targetValidation.success) {
    sendError(res, 400, 'BAD_REQUEST', 'Invalid event or user id.');
    return;
  }
  const result = await approveRequest(idValidation.data, targetValidation.data, req.user!.id);
  if (result.success) {
    res.status(204).send();
  } else {
    sendResult(res, result);
  }
});

export const rejectRequestHandler = catchAsync(async (req: Request, res: Response) => {
  const idValidation = ObjectIdSchema.safeParse(req.params.id);
  const targetValidation = ObjectIdSchema.safeParse(req.params.userId);
  if (!idValidation.success || !targetValidation.success) {
    sendError(res, 400, 'BAD_REQUEST', 'Invalid event or user id.');
    return;
  }
  const result = await rejectRequest(idValidation.data, targetValidation.data, req.user!.id);
  if (result.success) {
    res.status(204).send();
  } else {
    sendResult(res, result);
  }
});

export const searchPeopleHandler = catchAsync(async (req: Request, res: Response) => {
  const search = String(req.query.q ?? '').trim();
  if (!search) {
    sendError(res, 400, 'BAD_REQUEST', 'Search query is required.');
    return;
  }
  const result = await searchPeople(search, req.user?.id);
  sendResult(res, result);
});