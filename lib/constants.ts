// Shared Constants
// Centralized dropdown options and other constant data

import {
    ALL_REGION_COUNT,
    DEFAULT_PRODUCT_ID,
    US_REGION_NAMES,
    VISIBLE_PRODUCTS,
    getProductListPrice,
    resolveProductId,
} from './productCatalog';

// --- Product / state selection (derived from catalog) ---

/** @deprecated Prefer `productId` from `lib/productCatalog` — US region names for display */
export const stateOptions = US_REGION_NAMES;

/** @deprecated Use `getProductListPrice(productId)` — legacy per-region standard prices */
export const statePrices: Record<string, number> = Object.fromEntries(
    US_REGION_NAMES.map((name) => {
        const standard = VISIBLE_PRODUCTS.find(
            (p) => p.region === name && p.category === 'us_standard',
        );
        return [name, standard?.price ?? defaultIdPrice];
    }),
);

export { DEFAULT_PRODUCT_ID as defaultProductId, ALL_REGION_COUNT, resolveProductId, getProductListPrice };

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
    (_, i) => String(i + 1).padStart(2, '0'),
);

export const yearOptions = Array.from(
    { length: 100 },
    (_, i) => String(new Date().getFullYear() - i),
);

// --- Height Options ---
export const heightFeetOptions = ['4', '5', '6', '7'];

export const heightInchesOptions = Array.from(
    { length: 12 },
    (_, i) => String(i),
);

// --- Pricing (Single Source of Truth) ---
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
