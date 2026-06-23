// Shared Type Definitions
// Centralized types used across multiple components

// --- User & Authentication ---
export interface JwtPayload {
    userId: string;
    username: string;
    role: 'user' | 'admin';
    isReseller: boolean;
    exp: number;
    iat?: number; // Issued At
}


// --- ID Form Data ---
export interface IdFormData {
    id: number;
    /** Catalog product id, e.g. `PA:STANDARD` or `CA:DMV_POLY` */
    productId: string;
    /** Human-readable label for admin / legacy views — derived from productId */
    state: string;
    dobMonth: string;
    dobDay: string;
    dobYear: string;
    issueMonth: string;
    issueDay: string;
    issueYear: string;
    firstName: string;
    middleName: string;
    lastName: string;
    streetAddress: string;
    city: string;
    zipCode: string;
    zipPlus4: string;
    heightFeet: string;
    heightInches: string;
    weight: string;
    eyeColor: string;
    hairColor: string;
    sex: string;
    photo?: File;
    signature?: File;
    /** R2 object key after successful upload */
    photoKey?: string;
    signatureKey?: string;
    /** Original filename for display when `File` is not kept */
    photoFileName?: string;
    signatureFileName?: string;
}

// --- Order pricing ---
export type PricingMode = 'retail' | 'reseller_wholesale';

export interface OrderPriceFields {
    subtotal: number;
    total: number;
    idSubtotal?: number;
    listSubtotal?: number;
    volumeSavings?: number;
    idCount?: number;
    pricingMode?: PricingMode;
    perIdEffective?: number;
    handling?: number;
    shipping?: number;
    discountAmount?: number;
}

// --- Order Details ---
export interface OrderDetails {
    orderId: string;
    createdAt: string;
    status: 'pending' | 'processing' | 'shipped' | 'delivered';
    shipping?: string;
    paymentMethod: string;
    paymentStatus: 'Paid' | 'Unpaid';
    notes?: string;
    /** Admin message shown to customers on track / order pages */
    customerNotice?: string;
    price: OrderPriceFields;
    ids: IdFormData[];
    numberOfIds?: number;
    userId?: string;
    paymentIntentId?: string;
    cryptoAsset?: string;
    cryptoTxHash?: string;
    paymentExpiresAt?: string;
    customerPrice?: OrderPriceFields & { retailPerId?: number };
    wholesaleCost?: OrderPriceFields & { pricingMode?: PricingMode };
    source?: string;
    resellerId?: string;
    batchId?: string;
    batchStatus?: string;
}

// --- Tracking Stages ---
export interface TrackingStage {
    key: string;
    label: string;
}

export const TRACKING_STAGES: TrackingStage[] = [
    { key: 'pending', label: 'Order Created' },
    { key: 'processing', label: 'Order Processing' },
    { key: 'shipped', label: 'Shipped' },
    { key: 'delivered', label: 'Delivered' },
];

// --- Payment Methods ---
export interface PaymentMethod {
    name: string;
    icon: string;
}

export const PAYMENT_METHODS: PaymentMethod[] = [
    { name: 'Bitcoin', icon: '₿' },
    { name: 'Zelle', icon: 'Z' },
    { name: 'Apple Pay', icon: '' },
    { name: 'Cash App', icon: '$' },
    { name: 'Venmo', icon: 'V' },
];
