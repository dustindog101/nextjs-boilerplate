/**
 * Session-scoped caches so re-expanding rows does not re-resolve presigned URLs
 * and (when possible) reuses blob display URLs. Reduces R2 GET/signing churn.
 */

const PRESIGNED_MS = 13 * 60 * 1000;
const BLOB_DISPLAY_MS = 25 * 60 * 1000;
const MAX_ENTRIES = 64;

const presignedMemo = new Map<string, { url: string; at: number }>();
const blobMemo = new Map<string, { url: string; at: number }>();

function evictOldest(
  map: Map<string, { url: string; at: number }>,
  revoke: boolean
) {
  if (map.size < MAX_ENTRIES) return;
  let oldestK: string | undefined;
  let oldestT = Infinity;
  for (const [k, v] of map) {
    if (v.at < oldestT) {
      oldestT = v.at;
      oldestK = k;
    }
  }
  if (oldestK !== undefined) {
    const e = map.get(oldestK);
    if (revoke && e?.url.startsWith('blob:')) {
      URL.revokeObjectURL(e.url);
    }
    map.delete(oldestK);
  }
}

async function freshPresignedUrl(
  objectKey: string,
  resolvePresigned: (k: string) => Promise<string>
): Promise<string> {
  const p = presignedMemo.get(objectKey);
  if (p && Date.now() - p.at < PRESIGNED_MS) {
    return p.url;
  }
  const url = await resolvePresigned(objectKey);
  presignedMemo.set(objectKey, { url, at: Date.now() });
  evictOldest(presignedMemo, false);
  return url;
}

/**
 * Returns a URL suitable for `<img src>`: prefers a same-origin `blob:` URL (right-click
 * shows blob:… not R2). If `fetch(presigned)` fails (common when R2 CORS allows browser
 * `<img>` loads but not cross-origin `fetch`), falls back to the presigned HTTPS URL —
 * images do not require CORS for display, unlike `fetch()`.
 */
export async function getBlobDisplayUrlForKey(
  objectKey: string,
  resolvePresigned: (k: string) => Promise<string>
): Promise<string> {
  const hit = blobMemo.get(objectKey);
  if (hit && Date.now() - hit.at < BLOB_DISPLAY_MS) {
    return hit.url;
  }

  const presigned = await freshPresignedUrl(objectKey, resolvePresigned);

  try {
    const res = await fetch(presigned, { mode: 'cors' });
    if (!res.ok) {
      throw new Error('Could not load image.');
    }
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);

    const prev = blobMemo.get(objectKey);
    if (prev?.url.startsWith('blob:')) {
      URL.revokeObjectURL(prev.url);
    }
    blobMemo.set(objectKey, { url: blobUrl, at: Date.now() });
    evictOldest(blobMemo, true);
    return blobUrl;
  } catch {
    blobMemo.set(objectKey, { url: presigned, at: Date.now() });
    evictOldest(blobMemo, true);
    return presigned;
  }
}

/** Clear one key (e.g. after delete). */
export function invalidateViewCacheForKey(objectKey: string): void {
  const b = blobMemo.get(objectKey);
  if (b) {
    if (b.url.startsWith('blob:')) {
      URL.revokeObjectURL(b.url);
    }
    blobMemo.delete(objectKey);
  }
  presignedMemo.delete(objectKey);
}
