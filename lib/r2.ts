import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

const MAX_BYTES = 5 * 1024 * 1024;
const PRESIGN_PUT_TTL = 900;
const PRESIGN_GET_TTL = 900;

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export function assertAllowedImageType(contentType: string): void {
  if (!ALLOWED_TYPES.has(contentType)) {
    throw new Error('Invalid content type. Use JPEG, PNG, or WebP.');
  }
}

export function assertFileSize(fileSize: number): void {
  if (!Number.isFinite(fileSize) || fileSize <= 0 || fileSize > MAX_BYTES) {
    throw new Error('File must be between 1 byte and 5 MB.');
  }
}

function getClient(): S3Client {
  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error('R2 is not configured.');
  }
  return new S3Client({
    region: 'auto',
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  });
}

function bucket(): string {
  const b = process.env.R2_BUCKET_NAME;
  if (!b) throw new Error('R2_BUCKET_NAME is not set.');
  return b;
}

function extForContentType(ct: string): string {
  if (ct === 'image/jpeg') return 'jpg';
  if (ct === 'image/png') return 'png';
  if (ct === 'image/webp') return 'webp';
  return 'bin';
}

export async function getPresignedPutUrl(params: {
  keyPrefix: string;
  kind: 'photo' | 'signature';
  contentType: string;
  contentLength: number;
}): Promise<{ url: string; key: string }> {
  assertAllowedImageType(params.contentType);
  assertFileSize(params.contentLength);
  const id = randomUUID();
  const ext = extForContentType(params.contentType);
  const key = `${params.keyPrefix}${id}-${params.kind}.${ext}`;

  const client = getClient();
  const command = new PutObjectCommand({
    Bucket: bucket(),
    Key: key,
    ContentType: params.contentType,
    ContentLength: params.contentLength,
  });
  const url = await getSignedUrl(client, command, { expiresIn: PRESIGN_PUT_TTL });
  return { url, key };
}

export async function getPresignedGetUrl(objectKey: string): Promise<string> {
  const client = getClient();
  const command = new GetObjectCommand({
    Bucket: bucket(),
    Key: objectKey,
  });
  return getSignedUrl(client, command, { expiresIn: PRESIGN_GET_TTL });
}

export { MAX_BYTES as R2_MAX_UPLOAD_BYTES };
