import { Router } from 'express';
import {
  approveEventHandler,
  approveRequestHandler,
  createEventHandler,
  deleteEventHandler,
  getEventByIdHandler,
  getEventsHandler,
  getParticipantsHandler,
  getPendingApprovalEventsHandler,
  getPendingRequestsHandler,
  joinEventHandler,
  leaveEventHandler,
  rejectRequestHandler,
  searchPeopleHandler,
  toggleInterestHandler,
  updateEventHandler,
} from '../controllers/eventController.ts';
import { authHandler, optionalAuthHandler } from '../middleware/authMiddleware.ts';
import { createRateLimit } from '../middleware/rateLimit.ts';

const router = Router();
const eventReadLimiter = createRateLimit({ windowMs: 60_000, max: 120, scope: 'ip' });
const eventWriteLimiter = createRateLimit({ windowMs: 60_000, max: 30, scope: 'user_or_ip' });

router.get('/pending-approval', eventReadLimiter, authHandler, getPendingApprovalEventsHandler);
router.get('/search-people', eventReadLimiter, optionalAuthHandler, searchPeopleHandler);
router.get('/', eventReadLimiter, optionalAuthHandler, getEventsHandler);
router.get('/:id', eventReadLimiter, optionalAuthHandler, getEventByIdHandler);
router.get('/:id/participants', eventReadLimiter, optionalAuthHandler, getParticipantsHandler);
router.get('/:id/requests', eventReadLimiter, authHandler, getPendingRequestsHandler);
router.post('/', eventWriteLimiter, authHandler, createEventHandler);
router.put('/:id', eventWriteLimiter, authHandler, updateEventHandler);
router.patch('/:id/approve', eventWriteLimiter, authHandler, approveEventHandler);
router.delete('/:id', eventWriteLimiter, authHandler, deleteEventHandler);
router.post('/:id/join', eventWriteLimiter, authHandler, joinEventHandler);
router.post('/:id/leave', eventWriteLimiter, authHandler, leaveEventHandler);
router.post('/:id/interest', eventWriteLimiter, authHandler, toggleInterestHandler);
router.post('/:id/requests/:userId/approve', eventWriteLimiter, authHandler, approveRequestHandler);
router.post('/:id/requests/:userId/reject', eventWriteLimiter, authHandler, rejectRequestHandler);

export default router;
