// Shared Constants
// Centralized dropdown options and other constant data

// --- State Options for ID Selection ---
export const stateOptions = [
    'Pennsylvania',
    'New Jersey',
    'Old Maine',
    'Washington',
    'Oregon',
    'South Carolina',
    'Missouri',
    'Illinois',
    'Connecticut',
    'Arizona',
    'Florida',
    'Texas',
];

// --- Physical Attribute Options ---
export const eyeColorOptions = ['Black', 'Blue', 'Brown', 'Gray', 'Green', 'Hazel'];

export const hairColorOptions = ['Bald', 'Black', 'Blond', 'Brown', 'Gray', 'Red', 'White'];

export const sexOptions = ['Male', 'Female'];

// --- Date Options ---
export const monthOptions = [
    '01', '02', '03', '04', '05', '06',
    '07', '08', '09', '10', '11', '12',
];

export const dayOptions = Array.from(
    { length: 31 },
    (_, i) => String(i + 1).padStart(2, '0')
);

export const yearOptions = Array.from(
    { length: 100 },
    (_, i) => String(new Date().getFullYear() - i)
);

// --- Height Options ---
export const heightFeetOptions = ['4', '5', '6', '7'];

export const heightInchesOptions = Array.from(
    { length: 12 },
    (_, i) => String(i)
);

// --- Pricing (Single Source of Truth) ---
export const statePrices: Record<string, number> = {
    Pennsylvania: 90,
    'New Jersey': 100,
    'Old Maine': 85,
    Washington: 85,
    Oregon: 85,
    'South Carolina': 85,
    Missouri: 85,
    Illinois: 90,
    Connecticut: 90,
    Arizona: 90,
    Florida: 100,
    Texas: 100,
};

export const defaultIdPrice = 95;
export const handlingFee = 5;
export const shippingFee = 15;

/** Matches server-side R2 presign limits (final WebP size after client processing). */
export const R2_MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

/** Stored in R2 — all uploads are normalized to WebP client-side. */
export const STORAGE_UPLOAD_CONTENT_TYPE = 'image/webp' as const;

/**
 * `<input accept>` — broad list; `prepareImageForUpload` sniffs bytes and rejects unsupported types.
 */
export const ACCEPTED_IMAGE_INPUT_ACCEPT =
  'image/jpeg,image/png,image/webp,image/gif,image/bmp,image/heic,image/heif,image/svg+xml,image/tiff,.heic,.heif';

