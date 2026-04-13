/**
 * Client-only: normalize uploads to high-quality WebP, with size caps and magic-byte checks.
 * EXIF/metadata is stripped when drawing to canvas (browser behavior).
 */

import { R2_MAX_UPLOAD_BYTES } from './constants';

const MAX_DECODE_EDGE = 16384;
const MAX_OUTPUT_EDGE = 4096;
const MAX_PIXELS = 80_000_000;
const WEBP_QUALITY_MIN = 0.75;
const WEBP_QUALITY_START = 0.92;
const WEBP_QUALITY_STEP = 0.04;

type ImageSniff =
  | 'jpeg'
  | 'png'
  | 'gif'
  | 'webp'
  | 'bmp'
  | 'heic'
  | 'svg'
  | 'tiff';

async function readHeader(file: File, len: number): Promise<Uint8Array> {
  return new Uint8Array(await file.slice(0, len).arrayBuffer());
}

/** Magic-byte sniff; does not trust file.type or extension. */
async function sniffImageKind(file: File): Promise<ImageSniff | null> {
  const buf = await readHeader(file, 32);
  if (buf.length < 4) return null;

  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpeg';
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'png';
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) return 'gif';
  if (buf.length >= 12 && buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46) {
    const tag = String.fromCharCode(buf[8], buf[9], buf[10], buf[11]);
    if (tag === 'WEBP') return 'webp';
  }
  if (buf[0] === 0x42 && buf[1] === 0x4d) return 'bmp';
  if (
    (buf[0] === 0x49 && buf[1] === 0x49 && buf[2] === 0x2a && buf[3] === 0x00) ||
    (buf[0] === 0x4d && buf[1] === 0x4d && buf[2] === 0x00 && buf[3] === 0x2a)
  ) {
    return 'tiff';
  }
  if (buf.length >= 12 && buf[4] === 0x66 && buf[5] === 0x74 && buf[6] === 0x79 && buf[7] === 0x70) {
    const brand = String.fromCharCode(buf[8], buf[9], buf[10], buf[11]).toLowerCase();
    if (
      brand.includes('heic') ||
      brand.includes('heix') ||
      brand.includes('mif1') ||
      brand.includes('msf1') ||
      brand.includes('hevc')
    ) {
      return 'heic';
    }
  }

  const head = await file.slice(0, 4096).text();
  const t = head.trimStart();
  if (t.startsWith('<svg') || (t.startsWith('<?xml') && /<svg[\s>]/i.test(head))) {
    if (/<script[\s/>]/i.test(head) || /\bon[a-z]+\s*=/i.test(head) || /href\s*=\s*["']?\s*javascript:/i.test(head)) {
      throw new Error('UNSUPPORTED_IMAGE');
    }
    return 'svg';
  }

  return null;
}

async function heicToJpegBlob(file: File): Promise<Blob> {
  const mod = await import('heic2any');
  const heic2any = mod.default;
  const out = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 });
  const blob = Array.isArray(out) ? out[0] : out;
  if (!blob || blob.size === 0) throw new Error('IMAGE_PROCESSING_FAILED');
  return blob;
}

function assertDimensions(w: number, h: number): void {
  if (!Number.isFinite(w) || !Number.isFinite(h) || w < 1 || h < 1) {
    throw new Error('IMAGE_PROCESSING_FAILED');
  }
  if (w > MAX_DECODE_EDGE || h > MAX_DECODE_EDGE) {
    throw new Error('IMAGE_TOO_LARGE');
  }
  if (w * h > MAX_PIXELS) {
    throw new Error('IMAGE_TOO_LARGE');
  }
}

function scaleCanvas(canvas: HTMLCanvasElement, maxEdge: number): HTMLCanvasElement {
  let w = canvas.width;
  let h = canvas.height;
  if (w <= maxEdge && h <= maxEdge) return canvas;
  const scale = maxEdge / Math.max(w, h);
  w = Math.max(1, Math.round(w * scale));
  h = Math.max(1, Math.round(h * scale));
  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  const ctx = out.getContext('2d');
  if (!ctx) throw new Error('IMAGE_PROCESSING_FAILED');
  ctx.drawImage(canvas, 0, 0, w, h);
  return out;
}

async function bitmapToWebpFile(file: File, bitmap: ImageBitmap): Promise<File> {
  assertDimensions(bitmap.width, bitmap.height);
  const c = document.createElement('canvas');
  c.width = bitmap.width;
  c.height = bitmap.height;
  const ctx = c.getContext('2d');
  if (!ctx) throw new Error('IMAGE_PROCESSING_FAILED');
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();

  let working = scaleCanvas(c, MAX_OUTPUT_EDGE);
  let quality = WEBP_QUALITY_START;

  const tryBlob = (): Promise<Blob | null> =>
    new Promise((resolve) => {
      working.toBlob((b) => resolve(b), 'image/webp', quality);
    });

  for (let attempt = 0; attempt < 24; attempt++) {
    let blob = await tryBlob();
    if (!blob) {
      throw new Error('IMAGE_PROCESSING_FAILED');
    }
    if (blob.size <= R2_MAX_UPLOAD_BYTES) {
      const base = file.name.replace(/\.[^.]+$/, '') || 'upload';
      return new File([blob], `${base}.webp`, { type: 'image/webp' });
    }
    if (quality > WEBP_QUALITY_MIN + 0.01) {
      quality = Math.max(WEBP_QUALITY_MIN, quality - WEBP_QUALITY_STEP);
      continue;
    }
    const smaller = document.createElement('canvas');
    const nw = Math.max(256, Math.round(working.width * 0.85));
    const nh = Math.max(256, Math.round(working.height * 0.85));
    smaller.width = nw;
    smaller.height = nh;
    const sctx = smaller.getContext('2d');
    if (!sctx) throw new Error('IMAGE_PROCESSING_FAILED');
    sctx.drawImage(working, 0, 0, nw, nh);
    working = smaller;
    quality = WEBP_QUALITY_START;
  }

  throw new Error('IMAGE_TOO_LARGE');
}

async function decodeSvgToCanvas(file: File): Promise<HTMLCanvasElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    const done = new Promise<HTMLImageElement>((resolve, reject) => {
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('IMAGE_PROCESSING_FAILED'));
    });
    img.decoding = 'async';
    img.src = url;
    const loaded = await done;
    assertDimensions(loaded.naturalWidth, loaded.naturalHeight);
    const c = document.createElement('canvas');
    c.width = loaded.naturalWidth;
    c.height = loaded.naturalHeight;
    const ctx = c.getContext('2d');
    if (!ctx) throw new Error('IMAGE_PROCESSING_FAILED');
    ctx.drawImage(loaded, 0, 0);
    return c;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Validates, decodes, re-encodes to WebP. Throws Error with message codes used by `userFacingUploadError`.
 */
export async function prepareImageForUpload(file: File): Promise<File> {
  if (file.size > R2_MAX_UPLOAD_BYTES) {
    throw new Error('FILE_RAW_TOO_LARGE');
  }

  const kind = await sniffImageKind(file);
  if (!kind) {
    throw new Error('UNSUPPORTED_IMAGE');
  }

  if (kind === 'tiff') {
    throw new Error('UNSUPPORTED_IMAGE');
  }

  let decodeSource: Blob | File = file;

  if (kind === 'heic') {
    try {
      decodeSource = await heicToJpegBlob(file);
    } catch {
      throw new Error('IMAGE_PROCESSING_FAILED');
    }
    if (decodeSource.size > R2_MAX_UPLOAD_BYTES) {
      throw new Error('FILE_RAW_TOO_LARGE');
    }
  }

  if (kind === 'svg') {
    const canvas = await decodeSvgToCanvas(file);
    const bmp = await createImageBitmap(canvas);
    return bitmapToWebpFile(file, bmp);
  }

  try {
    const bitmap = await createImageBitmap(decodeSource);
    return bitmapToWebpFile(file, bitmap);
  } catch {
    throw new Error('IMAGE_PROCESSING_FAILED');
  }
}
