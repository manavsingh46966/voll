import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { type Request, type Response } from 'express';
import { sendError } from '../utils/http.ts';

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET = process.env.AWS_S3_BUCKET || '';
const URL_EXPIRY_SECONDS = 300;

export async function getS3PresignedUrlHandler(req: Request, res: Response) {
  const fileName = String(req.query.fileName ?? '').trim();
  const contentType = String(req.query.contentType ?? 'image/jpeg').trim();

  if (!fileName) {
    sendError(res, 400, 'BAD_REQUEST', 'fileName is required.');
    return;
  }

  if (!BUCKET) {
    sendError(res, 500, 'INTERNAL_ERROR', 'S3 bucket not configured.');
    return;
  }

  const key = `events/covers/${Date.now()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: contentType,
    });

    const presignedUrl = await getSignedUrl(s3, command, { expiresIn: URL_EXPIRY_SECONDS });
    const publicUrl = `https://${BUCKET}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/${key}`;

    res.json({ presignedUrl, publicUrl, key });
  } catch {
    sendError(res, 500, 'INTERNAL_ERROR', 'Failed to generate presigned URL.');
  }
}
