import mongoose from 'mongoose';
import { EventModel } from '../../models/event.ts';
import { EventRegistrationModel } from '../../models/eventRegistration.ts';
import { UserModel } from '../../models/user.ts';
import { createNotification } from '../notification/notificationService.ts';
import type { CreateEvent, UpdateEvent, EventsQuery } from '../../schemas/event.ts';
import type { UserBasicDetails } from '../../schemas/userBasicDetails.ts';
import type { Result, ErrorType } from '../../types/common/result.ts';

class ServiceException extends Error {
  constructor(public errorType: ErrorType, message: string) {
    super(message);
    this.name = 'ServiceException';
  }
}

function normalizeEvent(event: any) {
  const raw = typeof event?.toObject === 'function' ? event.toObject() : event;
  return raw;
}

async function getUserRegistrationContext(eventId: string, userId: string) {
  const reg = await EventRegistrationModel.findOne({
    eventId: new mongoose.Types.ObjectId(eventId),
    userId: new mongoose.Types.ObjectId(userId),
  }).lean();
  return {
    isJoined: reg?.status === 'joined',
    isPending: reg?.status === 'pending',
  };
}

async function hasTimeConflict(userId: string, startTime: Date, endTime: Date, excludeEventId?: string): Promise<boolean> {
  const query: any = {
    userId: new mongoose.Types.ObjectId(userId),
    status: 'joined',
    startTime: { $lt: endTime },
    endTime: { $gt: startTime },
  };
  if (excludeEventId) {
    query.eventId = { $ne: new mongoose.Types.ObjectId(excludeEventId) };
  }
  const conflict = await EventRegistrationModel.findOne(query).lean();
  return !!conflict;
}

export async function getEvents(query: EventsQuery, userId?: string): Promise<Result<any[]>> {
  try {
    const filter: Record<string, unknown> = {
      isDeleted: false,
      status: 'published',
    };

    if (query.cursor) {
      const cursorDate = new Date(query.cursor);
      if (Number.isNaN(cursorDate.getTime())) {
        return { success: false, errorType: 'BAD_REQUEST', message: 'Invalid cursor.' };
      }
      filter.fromDateTime = { $lt: cursorDate };
    }

    if (query.search) filter.$text = { $search: query.search };
    if (query.category) filter.category = query.category;
    if (query.locationType) filter.locationType = query.locationType;
    if (query.organizerId) filter.createdBy = new mongoose.Types.ObjectId(query.organizerId);

    if (query.joinedOnly && userId) {
      const userJoinedRegs = await EventRegistrationModel.find({
        userId: new mongoose.Types.ObjectId(userId),
        status: 'joined',
      }).select('eventId').lean();
      const joinedIds = userJoinedRegs.map((r) => r.eventId);
      filter._id = { $in: joinedIds };
    }

    const limit = query.limit ?? 10;
    const events = await EventModel.find(filter)
      .populate('createdBy', 'name email')
      .sort({ fromDateTime: -1 })
      .limit(limit)
      .lean();

    if (!userId) return { success: true, data: events.map(normalizeEvent) };

    const uid = new mongoose.Types.ObjectId(userId);
    const eventIds = events.map((e) => e._id);
    const registrations = await EventRegistrationModel.find({
      userId: uid,
      eventId: { $in: eventIds },
    }).lean();

    const regMap = new Map(registrations.map((r) => [r.eventId.toString(), r.status]));

    return {
      success: true,
      data: events.map((e) => {
        const status = regMap.get(e._id.toString());
        return {
          ...normalizeEvent(e),
          isJoined: status === 'joined',
          isPending: status === 'pending',
        };
      }),
    };
  } catch {
    return { success: false, errorType: 'INTERNAL_ERROR', message: 'Failed to fetch events.' };
  }
}

export async function getEventById(id: string, userId?: string): Promise<Result<any | null>> {
  try {
    const event = await EventModel.findOne({ _id: id, isDeleted: false })
      .populate('createdBy', 'name email')
      .populate('allowedGroups', 'name')
      .lean();

    if (!event) return { success: false, errorType: 'NOT_FOUND', message: 'Event not found.' };

    if (!userId) return { success: true, data: normalizeEvent(event) };

    const { isJoined, isPending } = await getUserRegistrationContext(id, userId);
    return {
      success: true,
      data: { ...normalizeEvent(event), isJoined, isPending },
    };
  } catch {
    return { success: false, errorType: 'INTERNAL_ERROR', message: 'Failed to fetch event.' };
  }
}

export async function createEvent(organizerId: string, data: CreateEvent): Promise<Result<any>> {
  try {
    const fromDate = new Date(data.fromDateTime);
    const toDate = data.toDateTime
      ? new Date(data.toDateTime)
      : new Date(fromDate.getTime() + 2 * 60 * 60 * 1000);
    const lastDate = data.lastDateToJoin ? new Date(data.lastDateToJoin) : undefined;
    const timeZoneStr =
      typeof data.timeZone === 'object'
        ? data.timeZone?.value || 'Asia/Kolkata'
        : data.timeZone || 'Asia/Kolkata';

    const normalizedSlots = (data.slots || []).map((s) => ({
      slotId: s.id || new mongoose.Types.ObjectId().toString(),
      title: s.title,
      startTime: s.startTime ? new Date(s.startTime) : fromDate,
      endTime: s.endTime ? new Date(s.endTime) : toDate,
      maxParticipants: s.maxParticipants || 0,
      currentParticipants: 0,
    }));

    const event = new EventModel({
      ...data,
      fromDateTime: fromDate,
      toDateTime: toDate,
      lastDateToJoin: lastDate,
      timeZone: timeZoneStr,
      slots: normalizedSlots,
      createdBy: new mongoose.Types.ObjectId(organizerId),
      status: 'pending_approval',
    });

    try {
      await event.save();
    } catch (saveErr: any) {
      if (saveErr?.code === 11000 && (saveErr?.message?.includes('eventId_1') || saveErr?.keyPattern?.eventId)) {
        console.warn('Detected stale eventId_1 index. Dropping and retrying save...');
        await mongoose.connection.collection('events').dropIndex('eventId_1').catch(() => {});
        await event.save();
      } else {
        throw saveErr;
      }
    }

    return { success: true, data: normalizeEvent(event) };
  } catch (err: any) {
    console.error('Error creating event:', err);
    return { success: false, errorType: 'INTERNAL_ERROR', message: err?.message || 'Failed to create event.' };
  }
}

export async function updateEvent(id: string, organizerId: string, data: UpdateEvent): Promise<Result<any | null>> {
  try {
    const setData: Record<string, unknown> = { ...data };
    if (typeof data.fromDateTime === 'string') setData.fromDateTime = new Date(data.fromDateTime);
    if (typeof data.toDateTime === 'string') setData.toDateTime = new Date(data.toDateTime);

    const event = await EventModel.findOneAndUpdate(
      { _id: id, createdBy: organizerId, isDeleted: false },
      { $set: setData },
      { new: true },
    );

    if (!event) return { success: false, errorType: 'NOT_FOUND', message: 'Event not found or unauthorized.' };
    return { success: true, data: normalizeEvent(event) };
  } catch {
    return { success: false, errorType: 'INTERNAL_ERROR', message: 'Failed to update event.' };
  }
}

export async function approveEvent(id: string, actor: UserBasicDetails): Promise<Result<any>> {
  try {
    const canApprove = actor.role === 'superadmin' || actor.permissions.includes('event:approve');
    if (!canApprove) return { success: false, errorType: 'FORBIDDEN', message: 'Unauthorized to approve events.' };

    const event = await EventModel.findOneAndUpdate(
      { _id: id, isDeleted: false, status: 'pending_approval' },
      {
        $set: {
          status: 'published',
          approvedBy: new mongoose.Types.ObjectId(actor.id),
          approvedAt: new Date(),
        },
      },
      { new: true },
    );

    if (!event) return { success: false, errorType: 'NOT_FOUND', message: 'Event not found or already processed.' };
    return { success: true, data: normalizeEvent(event) };
  } catch {
    return { success: false, errorType: 'INTERNAL_ERROR', message: 'Failed to approve event.' };
  }
}

export async function deleteEvent(id: string, organizerId: string): Promise<Result<void>> {
  try {
    const event = await EventModel.findOneAndUpdate(
      { _id: id, createdBy: organizerId, isDeleted: false },
      { $set: { isDeleted: true, deletedAt: new Date(), status: 'cancelled' } },
    );
    if (!event) return { success: false, errorType: 'NOT_FOUND', message: 'Event not found or unauthorized.' };
    return { success: true, data: undefined };
  } catch {
    return { success: false, errorType: 'INTERNAL_ERROR', message: 'Failed to delete event.' };
  }
}

export async function joinEvent(eventId: string, userId: string, slotId?: string): Promise<Result<any>> {
  const session = await mongoose.startSession();
  try {
    let resultPayload: any;

    await session.withTransaction(async () => {
      const event = await EventModel.findOne({
        _id: eventId,
        isDeleted: false,
        status: 'published',
      }).session(session).lean();

      if (!event) throw new ServiceException('NOT_FOUND', 'Event not found.');

      const existing = await EventRegistrationModel.findOne({
        eventId: new mongoose.Types.ObjectId(eventId),
        userId: new mongoose.Types.ObjectId(userId),
      }).session(session).lean();

      if (existing) {
        throw new ServiceException('CONFLICT', `You have already ${existing.status === 'joined' ? 'joined' : 'requested to join'} this event.`);
      }

      let slotStart: Date = (event as any).fromDateTime;
      let slotEnd: Date = (event as any).toDateTime;

      if (slotId && Array.isArray((event as any).slots)) {
        const slot = (event as any).slots.find((s: any) => s.slotId === slotId);
        if (!slot) throw new ServiceException('NOT_FOUND', 'Slot not found.');
        slotStart = new Date(slot.startTime);
        slotEnd = new Date(slot.endTime);
      }

      const conflict = await hasTimeConflict(userId, slotStart, slotEnd, eventId);
      if (conflict) {
        throw new ServiceException('CONFLICT', 'Time conflict: You are already registered for another event at this time.');
      }

      const regStatus = (event as any).allowJoiningRequests ? 'pending' : 'joined';

      await EventRegistrationModel.create(
        [
          {
            userId: new mongoose.Types.ObjectId(userId),
            eventId: new mongoose.Types.ObjectId(eventId),
            slotId: slotId ?? null,
            startTime: slotStart,
            endTime: slotEnd,
            status: regStatus,
          },
        ],
        { session }
      );

      if (regStatus === 'joined') {
        if (slotId) {
          await EventModel.findOneAndUpdate(
            { _id: eventId, 'slots.slotId': slotId },
            { 
              $inc: { 
                numberOfVolunteers: 1,
                'slots.$.currentParticipants': 1 
              } 
            }
          ).session(session);
        } else {
          await EventModel.findByIdAndUpdate(
            eventId,
            { $inc: { numberOfVolunteers: 1 } }
          ).session(session);
        }
      }

      const message = regStatus === 'joined' ? 'You joined this event.' : 'Request sent successfully.';
      resultPayload = { status: regStatus, message, eventTitle: (event as any).title, organizerId: String((event as any).createdBy) };
    });

    if (resultPayload?.status === 'joined') {
      const user = await UserModel.findById(userId).lean();
      const userName = user?.name || 'A volunteer';

      // Notify attendee
      createNotification({
        recipient: userId,
        type: 'event_join',
        title: `Event Joined: ${resultPayload.eventTitle}`,
        message: `You have successfully registered for "${resultPayload.eventTitle}". We're excited to have you on board!`,
        data: { eventId },
      });

      // Notify organizer
      createNotification({
        recipient: resultPayload.organizerId,
        sender: userId,
        type: 'event_join',
        title: `New Volunteer Joined!`,
        message: `${userName} joined your event "${resultPayload.eventTitle}".`,
        data: { eventId, userId },
      });
    }

    return { success: true, data: { status: resultPayload.status, message: resultPayload.message } };
  } catch (error: unknown) {
    if (error instanceof ServiceException) {
      return { success: false, errorType: error.errorType, message: error.message };
    }
    return { success: false, errorType: 'INTERNAL_ERROR', message: 'Failed to join event.' };
  } finally {
    await session.endSession();
  }
}

export async function leaveEvent(eventId: string, userId: string): Promise<Result<void>> {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const reg = await EventRegistrationModel.findOneAndDelete({
        eventId: new mongoose.Types.ObjectId(eventId),
        userId: new mongoose.Types.ObjectId(userId),
      }).session(session).lean();

      if (!reg) throw new ServiceException('NOT_FOUND', 'Registration not found.');

      if (reg.status === 'joined') {
        if (reg.slotId) {
          await EventModel.findOneAndUpdate(
            { _id: eventId, 'slots.slotId': reg.slotId },
            { 
              $inc: { 
                numberOfVolunteers: -1,
                'slots.$.currentParticipants': -1 
              } 
            }
          ).session(session);
        } else {
          await EventModel.findByIdAndUpdate(
            eventId,
            { $inc: { numberOfVolunteers: -1 } }
          ).session(session);
        }
      }
    });

    return { success: true, data: undefined };
  } catch (error: unknown) {
    if (error instanceof ServiceException) {
      return { success: false, errorType: error.errorType, message: error.message };
    }
    return { success: false, errorType: 'INTERNAL_ERROR', message: 'Failed to leave event.' };
  } finally {
    await session.endSession();
  }
}

export async function toggleInterest(eventId: string, userId: string): Promise<Result<{ isInterested: boolean }>> {
  try {
    const uid = new mongoose.Types.ObjectId(userId);
    const event = await EventModel.findOne({ _id: eventId, isDeleted: false }).lean();
    if (!event) return { success: false, errorType: 'NOT_FOUND', message: 'Event not found.' };

    const isInterested = ((event as any).interestedUsers ?? []).some((u: any) => u.toString() === userId);
    if (isInterested) {
      await EventModel.findByIdAndUpdate(eventId, { $pull: { interestedUsers: uid } });
    } else {
      await EventModel.findByIdAndUpdate(eventId, { $addToSet: { interestedUsers: uid } });
    }
    return { success: true, data: { isInterested: !isInterested } };
  } catch {
    return { success: false, errorType: 'INTERNAL_ERROR', message: 'Failed to toggle interest.' };
  }
}

export async function getParticipants(eventId: string): Promise<Result<any[]>> {
  try {
    const regs = await EventRegistrationModel.find({
      eventId: new mongoose.Types.ObjectId(eventId),
      status: 'joined',
    })
      .populate('userId', 'name email')
      .lean();

    return { success: true, data: regs.map((r) => r.userId) };
  } catch {
    return { success: false, errorType: 'INTERNAL_ERROR', message: 'Failed to fetch participants.' };
  }
}

export async function getPendingRequests(eventId: string, organizerId: string): Promise<Result<any[]>> {
  try {
    const event = await EventModel.findOne({ _id: eventId, createdBy: organizerId, isDeleted: false }).lean();
    if (!event) return { success: false, errorType: 'FORBIDDEN', message: 'Event not found or unauthorized.' };

    const regs = await EventRegistrationModel.find({
      eventId: new mongoose.Types.ObjectId(eventId),
      status: 'pending',
    })
      .populate('userId', 'name email')
      .lean();

    return { success: true, data: regs.map((r) => ({ ...r.userId as any, registrationId: r._id })) };
  } catch {
    return { success: false, errorType: 'INTERNAL_ERROR', message: 'Failed to fetch pending requests.' };
  }
}

export async function approveRequest(eventId: string, targetUserId: string, organizerId: string): Promise<Result<void>> {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const event = await EventModel.findOne({ _id: eventId, createdBy: organizerId, isDeleted: false })
        .session(session).lean();
        
      if (!event) throw new ServiceException('FORBIDDEN', 'Event not found or unauthorized.');

      const reg = await EventRegistrationModel.findOneAndUpdate(
        {
          eventId: new mongoose.Types.ObjectId(eventId),
          userId: new mongoose.Types.ObjectId(targetUserId),
          status: 'pending',
        },
        { $set: { status: 'joined' } },
        { new: true, session }
      );

      if (!reg) throw new ServiceException('NOT_FOUND', 'Pending request not found.');

      if (reg.slotId) {
        await EventModel.findOneAndUpdate(
          { _id: eventId, 'slots.slotId': reg.slotId },
          { 
            $inc: { 
              numberOfVolunteers: 1,
              'slots.$.currentParticipants': 1 
            } 
          }
        ).session(session);
      } else {
        await EventModel.findByIdAndUpdate(
          eventId,
          { $inc: { numberOfVolunteers: 1 } }
        ).session(session);
      }
    });

    const event = await EventModel.findById(eventId).lean();
    if (event) {
      createNotification({
        recipient: targetUserId,
        sender: organizerId,
        type: 'event_approved',
        title: 'Join Request Approved!',
        message: `Your request to join "${event.title}" has been approved. See you there!`,
        data: { eventId },
      });
    }

    return { success: true, data: undefined };
  } catch (error: unknown) {
    if (error instanceof ServiceException) {
      return { success: false, errorType: error.errorType, message: error.message };
    }
    return { success: false, errorType: 'INTERNAL_ERROR', message: 'Failed to approve request.' };
  } finally {
    await session.endSession();
  }
}

export async function rejectRequest(eventId: string, targetUserId: string, organizerId: string): Promise<Result<void>> {
  try {
    const event = await EventModel.findOne({ _id: eventId, createdBy: organizerId, isDeleted: false }).lean();
    if (!event) return { success: false, errorType: 'FORBIDDEN', message: 'Event not found or unauthorized.' };

    const reg = await EventRegistrationModel.findOneAndDelete({
      eventId: new mongoose.Types.ObjectId(eventId),
      userId: new mongoose.Types.ObjectId(targetUserId),
      status: 'pending',
    });

    if (!reg) return { success: false, errorType: 'NOT_FOUND', message: 'Pending request not found.' };
    return { success: true, data: undefined };
  } catch {
    return { success: false, errorType: 'INTERNAL_ERROR', message: 'Failed to reject request.' };
  }
}

export async function searchPeople(search: string, excludeId?: string): Promise<Result<any[]>> {
  try {
    const query: Record<string, unknown> = {
      isDeleted: false,
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ],
    };
    if (excludeId) query._id = { $ne: new mongoose.Types.ObjectId(excludeId) };

    const users = await UserModel.find(query).select('name email').limit(50).lean();
    return { success: true, data: users };
  } catch {
    return { success: false, errorType: 'INTERNAL_ERROR', message: 'Failed to search people.' };
  }
}

export async function getPendingApprovalEvents(actor: UserBasicDetails): Promise<Result<any[]>> {
  try {
    const canApprove = actor.role === 'superadmin' || actor.permissions.includes('event:approve');
    if (!canApprove) return { success: false, errorType: 'FORBIDDEN', message: 'Unauthorized.' };

    const events = await EventModel.find({ status: 'pending_approval', isDeleted: false })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    return { success: true, data: events.map(normalizeEvent) };
  } catch {
    return { success: false, errorType: 'INTERNAL_ERROR', message: 'Failed to fetch pending events.' };
  }
}