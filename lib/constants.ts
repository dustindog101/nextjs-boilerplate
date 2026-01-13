// Shared Constants
// Centralized dropdown options and other constant data

// --- State Options for ID Selection ---
export const STATE_OPTIONS = [
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
export const EYE_COLOR_OPTIONS = [
    'Brown',
    'Blue',
    'Green',
    'Hazel',
    'Gray',
    'Amber',
];

export const HAIR_COLOR_OPTIONS = [
    'Black',
    'Brown',
    'Blonde',
    'Red',
    'Gray',
    'White',
    'Auburn',
];

export const SEX_OPTIONS = ['Male', 'Female'];

// --- Date Options ---
export const MONTH_OPTIONS = [
    '01', '02', '03', '04', '05', '06',
    '07', '08', '09', '10', '11', '12',
];

export const DAY_OPTIONS = Array.from(
    { length: 31 },
    (_, i) => String(i + 1).padStart(2, '0')
);

export const YEAR_OPTIONS = Array.from(
    { length: 100 },
    (_, i) => String(new Date().getFullYear() - i)
);

// --- Height Options ---
export const HEIGHT_FEET_OPTIONS = ['4', '5', '6', '7'];

export const HEIGHT_INCHES_OPTIONS = Array.from(
    { length: 12 },
    (_, i) => String(i)
);

// --- Pricing ---
export const STATE_PRICES: Record<string, number> = {
    Pennsylvania: 95,
    'New Jersey': 95,
    'Old Maine': 95,
    Washington: 95,
    Oregon: 95,
    'South Carolina': 95,
    Missouri: 95,
    Illinois: 95,
    Connecticut: 95,
    Arizona: 95,
    Florida: 95,
    Texas: 95,
};

export const DEFAULT_ID_PRICE = 95;
export const SHIPPING_COST = 20;
