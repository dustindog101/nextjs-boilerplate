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
export const eyeColorOptions = [
    'Brown',
    'Blue',
    'Green',
    'Hazel',
    'Gray',
    'Amber',
];

export const hairColorOptions = [
    'Black',
    'Brown',
    'Blonde',
    'Red',
    'Gray',
    'White',
    'Auburn',
];

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

// --- Pricing ---
export const statePrices: Record<string, number> = {
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

export const defaultIdPrice = 95;
export const shippingCost = 20;
