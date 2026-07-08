import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { R2_MAX_UPLOAD_BYTES, STORAGE_UPLOAD_CONTENT_TYPE } from './constants';

const PRESIGN_PUT_TTL = 900;
export const PRESIGN_GET_TTL = 900;

/**
 * Maximum allowed TTL for a presigned GET URL. AWS S3 / Cloudflare R2 reject
 * any value above 7 days (604800s) at signing time.
 */
export const PRESIGN_GET_MAX_TTL = 7 * 24 * 60 * 60; // 604800

/**
 * Predefined link-expiry options surfaced in the admin export modal.
 * `value` is the TTL in seconds (sent to /api/uploads/presign-get); `label`
 * is what the admin sees in the dropdown.
 */
export const PRESIGN_GET_TTL_OPTIONS: { value: number; label: string }[] = [
  { value: 60 * 60, label: '1 hour' },
  { value: 12 * 60 * 60, label: '12 hours' },
  { value: 24 * 60 * 60, label: '24 hours' },
  { value: 7 * 24 * 60 * 60, label: '7 days' },
];

/**
 * Clamp a caller-provided TTL into the safe [1, PRESIGN_GET_MAX_TTL] range.
 * Non-finite / non-positive values fall back to the default PRESIGN_GET_TTL.
 */
export function clampPresignGetTtl(expiresInSeconds?: number): number {
  if (!Number.isFinite(expiresInSeconds) || (expiresInSeconds as number) <= 0) {
    return PRESIGN_GET_TTL;
  }
  return Math.min(Math.floor(expiresInSeconds as number), PRESIGN_GET_MAX_TTL);
}

export function assertAllowedImageType(contentType: string): void {
  if (contentType !== STORAGE_UPLOAD_CONTENT_TYPE) {
    throw new Error('Invalid content type. Uploads must be WebP.');
  }
}

export function assertFileSize(fileSize: number): void {
  if (!Number.isFinite(fileSize) || fileSize <= 0 || fileSize > R2_MAX_UPLOAD_BYTES) {
    throw new Error(`File must be between 1 byte and ${R2_MAX_UPLOAD_BYTES / (1024 * 1024)} MB.`);
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
  if (ct === STORAGE_UPLOAD_CONTENT_TYPE) return 'webp';
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
  // Do not sign Content-Length: browsers must send the exact byte length; binding it into
  // SigV4 often causes 403 / opaque XHR failures. Size is still enforced server-side below.
  const command = new PutObjectCommand({
    Bucket: bucket(),
    Key: key,
    ContentType: params.contentType,
  });
  const url = await getSignedUrl(client, command, { expiresIn: PRESIGN_PUT_TTL });
  return { url, key };
}

export async function getPresignedGetUrl(
  objectKey: string,
  expiresInSeconds: number = PRESIGN_GET_TTL
): Promise<string> {
  const expiresIn = clampPresignGetTtl(expiresInSeconds);
  const client = getClient();
  const command = new GetObjectCommand({
    Bucket: bucket(),
    Key: objectKey,
  });
  return getSignedUrl(client, command, { expiresIn });
}

export async function deleteObjectFromR2(objectKey: string): Promise<void> {
  if (!objectKey || objectKey.includes('..') || objectKey.startsWith('/')) {
    throw new Error('Invalid key.');
  }
  const client = getClient();
  await client.send(
    new DeleteObjectCommand({
      Bucket: bucket(),
      Key: objectKey,
    })
  );
}
