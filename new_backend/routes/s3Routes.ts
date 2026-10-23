import { Router } from 'express';
import { getS3PresignedUrlHandler } from '../controllers/s3Controller.ts';
import { authHandler } from '../middleware/authMiddleware.ts';
import { createRateLimit } from '../middleware/rateLimit.ts';

const router = Router();
const uploadLimiter = createRateLimit({ windowMs: 60_000, max: 20, scope: 'user_or_ip' });

router.get('/presigned-url', uploadLimiter, authHandler, getS3PresignedUrlHandler);

export default router;
