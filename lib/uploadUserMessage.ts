/**
 * Maps upload-related errors to short, user-safe strings (no infra URLs or dev hints).
 */
export function userFacingUploadError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  if (raw === '__upload_network__') {
    return 'Network error. Try again.';
  }
  const m = raw.toLowerCase();

  if (
    raw === 'UNSUPPORTED_IMAGE' ||
    raw === 'FILE_RAW_TOO_LARGE' ||
    raw === 'IMAGE_TOO_LARGE' ||
    raw === 'IMAGE_PROCESSING_FAILED'
  ) {
    if (raw === 'FILE_RAW_TOO_LARGE' || raw === 'IMAGE_TOO_LARGE') {
      return 'File is too large. Use an image under 15 MB.';
    }
    if (raw === 'UNSUPPORTED_IMAGE') {
      return 'Unsupported image type. Use a common photo format (e.g. JPEG, PNG, HEIC, WebP).';
    }
    return 'Could not process that image. Try another file.';
  }

  if (
    m.includes('jpeg') ||
    m.includes('png') ||
    m.includes('webp') ||
    m.includes('heic') ||
    m.includes('content type') ||
    m.includes('invalid content')
  ) {
    return 'Use a supported image type.';
  }
  if (m.includes('mb') && (m.includes('file') || m.includes('byte'))) {
    return 'File must be 15 MB or smaller.';
  }
  if (m.includes('not authenticated') || m.includes('authentication required') || m.includes('sign in')) {
    return 'Please sign in to upload.';
  }
  if (m.includes('invalid or expired') || m.includes('upload session')) {
    return 'Session expired. Refresh the page and try again.';
  }
  if (m.includes('upload signing') || m.includes('not configured')) {
    return 'Upload is temporarily unavailable. Try again later.';
  }

  return 'Network error. Try again.';
}
