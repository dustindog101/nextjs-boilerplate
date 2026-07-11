// --- lib/apiClient.ts ---
// Centralized API client. All calls go through Next.js Route Handlers
// (app/api/*) which proxy to Lambda functions server-side.
// Lambda URLs are NEVER exposed to the browser.

import { getStorageItem } from './storage';
import {
  listCryptoMethods as _listCryptoMethods,
  createPaymentIntent as _createPaymentIntent,
  getPaymentIntent as _getPaymentIntent,
  cancelPaymentIntent as _cancelPaymentIntent,
  adminGetPaymentSettings as _adminGetPaymentSettings,
  adminUpdatePaymentSettings as _adminUpdatePaymentSettings,
  adminSetOrderPaymentExpiry as _adminSetOrderPaymentExpiry,
} from './payments/api';

// --- Type Definitions ---

interface LoginPayload {
  requestType: 'login';
  username: string;
  password: string;
}

interface RegisterPayload {
  requestType: 'register';
  username: string;
  password: string;
  confirmPassword: string;
  referrer?: string;
}

interface LoginResponse {
  message: string;
  token: string;
}

interface RegisterResponse {
  message: string;
}

interface ErrorResponse {
  error: string;
  code?: string;
  lambdaHttpStatus?: number;
}

export interface User {
  userId: string;
  username: string;
  role: 'user' | 'admin';
  isReseller: boolean;
  createdAt: string;
  updatedAt: string;
  discount?: {
    type: 'percentage' | 'fixed';
    value: number;
  };
  referredBy?: string;
  registrationIp?: string;
  lastLoginIp?: string;
  lastLoginAt?: string;
  loginIpHistory?: { ip: string; at: string }[];
}


// ====================================================================
// INTERNAL FETCH WRAPPER
// ====================================================================

/**
 * A generic fetch wrapper for API calls to our local Route Handlers.
 * Handles JSON parsing and error propagation.
 */
async function apiFetch<T>(url: string, options: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok) {
    const d = data as ErrorResponse;
    const msg = d.error || 'An unknown API error occurred.';
    const parts = [msg];
    if (d.code) parts.push(`[${d.code}]`);
    if (d.lambdaHttpStatus != null) parts.push(`(HTTP ${d.lambdaHttpStatus})`);
    throw new Error(parts.join(' '));
  }
  return data as T;
}

/**
 * Helper to build headers with auth token when available.
 */
function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const token = getStorageItem('idPirateAuthToken');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}


// ====================================================================
// PUBLIC & USER-FACING API FUNCTIONS
// ====================================================================

/**
 * Handles user registration.
 */
export const registerUser = async (
  payload: Omit<RegisterPayload, 'requestType'>
): Promise<RegisterResponse> => {
  const fullPayload: RegisterPayload = { ...payload, requestType: 'register' };
  return apiFetch<RegisterResponse>('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fullPayload),
  });
};

/**
 * Handles user login.
 */
export const loginUser = async (
  payload: Omit<LoginPayload, 'requestType'>
): Promise<LoginResponse> => {
  const fullPayload: LoginPayload = { ...payload, requestType: 'login' };
  return apiFetch<LoginResponse>('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fullPayload),
  });
};

/**
 * Fetches all orders for the currently authenticated user. (Protected)
 */
export const fetchUserOrders = async (): Promise<{ orders: any[] }> => {
  const token = getStorageItem('idPirateAuthToken');
  if (!token) {
    throw new Error('No authentication token found for protected route.');
  }
  return apiFetch<{ orders: any[] }>('/api/orders', {
    method: 'GET',
    headers: authHeaders(),
  });
};

/**
 * Fetches orders for the logged-in reseller (whitelabel attribution). (Protected)
 */
export const fetchResellerOrders = async (): Promise<{ orders: any[] }> => {
  const token = getStorageItem('idPirateAuthToken');
  if (!token) {
    throw new Error('No authentication token found for protected route.');
  }
  return apiFetch<{ orders: any[] }>('/api/reseller/orders', {
    method: 'GET',
    headers: authHeaders(),
  });
};

/**
 * Fetches a single order for the reseller dashboard if the caller owns it.
 */
export const fetchResellerOrderById = async (orderId: string): Promise<any> => {
  const token = getStorageItem('idPirateAuthToken');
  if (!token) {
    throw new Error('No authentication token found for protected route.');
  }
  const enc = encodeURIComponent(orderId);
  return apiFetch<any>(`/api/reseller/orders/${enc}`, {
    method: 'GET',
    headers: authHeaders(),
  });
};

/**
 * Submits a new order.
 */
export const submitOrder = async (payload: any): Promise<{ orderId: string }> => {
  return apiFetch<{ orderId: string }>('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
};

/**
 * Tracks an order by ID (Public summary — no auth required).
 */
export const trackOrder = async (orderId: string): Promise<any> => {
  return apiFetch<any>('/api/orders/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId, requestType: 'track' }),
  });
};

/**
 * Fetches a single order by ID (authenticated — user can only see their own).
 */
export const fetchOrderById = async (orderId: string): Promise<any> => {
  return apiFetch<any>('/api/orders/track', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ orderId, requestType: 'get_order' }),
  });
};

/**
 * Validates a discount code against the current order total.
 */
export interface DiscountValidation {
  code: string;
  discountType: 'percentage' | 'fixed';
  value: number;
  discountAmount: number;
  newTotal: number;
}

export const validateDiscount = async (
  code: string,
  orderTotal: number
): Promise<DiscountValidation> => {
  return apiFetch<DiscountValidation>('/api/orders/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requestType: 'validate_discount', code, orderTotal }),
  });
};


// ====================================================================
// CRYPTO PAYMENTS — re-exported from lib/payments (isolated module)
// ====================================================================

export const listCryptoMethods = _listCryptoMethods;
export const createPaymentIntent = _createPaymentIntent;
export const getPaymentIntent = _getPaymentIntent;
export const cancelPaymentIntent = _cancelPaymentIntent;


// ====================================================================
// R2 UPLOADS (presigned PUT to Cloudflare R2)
// ====================================================================

export interface UploadPresignBody {
  contentType: string;
  kind: 'photo' | 'signature';
  idFormClientId: number;
  fileSize: number;
}

export interface UploadPresignResponse {
  url: string;
  key: string;
  contentType: string;
  contentLength: number;
}

export interface ResellerUploadSessionResponse {
  token: string;
  expiresAt: string;
}

/**
 * Requests a presigned PUT URL. Pass either logged-in user token (default from storage)
 * or a reseller upload session token in opts.resellerUploadToken.
 */
export const requestUploadPresign = async (
  body: UploadPresignBody,
  opts?: { resellerUploadToken?: string | null }
): Promise<UploadPresignResponse> => {
  const token =
    opts?.resellerUploadToken ?? getStorageItem('idPirateAuthToken');
  if (!token) {
    throw new Error('Not authenticated for upload.');
  }
  return apiFetch<UploadPresignResponse>('/api/uploads/presign', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
};

/**
 * PUT file bytes to R2 using a presigned URL (XMLHttpRequest for upload progress).
 */
export const uploadFileToR2 = (
  presign: UploadPresignResponse,
  file: File,
  onProgress?: (percent: number) => void
): Promise<void> =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', presign.url);
    xhr.setRequestHeader('Content-Type', presign.contentType);
    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable && onProgress) {
        onProgress(Math.round((ev.loaded / Math.max(ev.total, 1)) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
        return;
      }
      reject(new Error('__upload_network__'));
    };
    xhr.onerror = () => reject(new Error('__upload_network__'));
    xhr.send(file);
  });

/** Anonymous reseller portal: obtain token for /api/uploads/presign (Bearer). */
export const createResellerUploadSession = async (
  resellerId: string
): Promise<ResellerUploadSessionResponse> => {
  return apiFetch<ResellerUploadSessionResponse>('/api/uploads/reseller-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resellerId }),
  });
};

/**
 * Deletes an object from R2 if the caller owns the key prefix (user, reseller, or admin).
 */
export const deleteUploadedObject = async (
  objectKey: string,
  opts?: { resellerUploadToken?: string | null }
): Promise<void> => {
  const token =
    opts?.resellerUploadToken ?? getStorageItem('idPirateAuthToken');
  if (!token) {
    throw new Error('Not authenticated for upload.');
  }
  await apiFetch<{ ok: boolean }>('/api/uploads/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ key: objectKey }),
  });
};


// ====================================================================
// ADMIN-ONLY API FUNCTIONS
// ====================================================================

/**
 * Generic wrapper for admin requests. Includes auth token automatically.
 */
async function adminApiFetch<T>(payload: object): Promise<T> {
  const token = getStorageItem('idPirateAuthToken');
  if (!token) {
    throw new Error('Admin action requires authentication token.');
  }
  return apiFetch<T>('/api/admin', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
}

// ── User Management ─────────────────────────────────────────────────

/**
 * Fetches a list of all users from the admin endpoint.
 */
export const listAllUsers = async (): Promise<User[]> => {
  return adminApiFetch<User[]>({ requestType: 'list_all_users' });
};

/**
 * Updates a user's data via the admin endpoint.
 */
export const adminUpdateUser = async (
  userId: string,
  username: string,
  updateData: Partial<User>
): Promise<{ message: string }> => {
  return adminApiFetch<{ message: string }>({
    requestType: 'admin_update_user',
    userId,
    username,
    updateData,
  });
};

// ── Order Management ────────────────────────────────────────────────

export const adminListOrders = async (): Promise<any[]> => {
  return adminApiFetch<any[]>({ requestType: 'list_all_orders' });
};

export const adminGetOrder = async (orderId: string): Promise<any> => {
  return adminApiFetch<any>({ requestType: 'get_order', orderId });
};

export const adminUpdateOrder = async (
  orderId: string,
  updateData: Record<string, any>
): Promise<{ message: string }> => {
  return adminApiFetch<{ message: string }>({
    requestType: 'admin_update_order',
    orderId,
    updateData,
  });
};

// ── Discount Management ─────────────────────────────────────────────

export interface Discount {
  code: string;
  discountType: 'percentage' | 'fixed';
  value: number;
  minOrder: number;
  maxUses?: number;
  usedCount: number;
  isActive: boolean;
  startsAt?: string;
  expiresAt?: string;
  allowedUsernames?: string[];
  createdAt: string;
}

export const adminListDiscounts = async (): Promise<Discount[]> => {
  return adminApiFetch<Discount[]>({ requestType: 'list_discounts' });
};

export const adminCreateDiscount = async (
  data: Omit<Discount, 'usedCount' | 'isActive' | 'createdAt'>
): Promise<{ message: string }> => {
  return adminApiFetch<{ message: string }>({
    requestType: 'create_discount',
    ...data,
  });
};

export const adminUpdateDiscount = async (
  code: string,
  updateData: Partial<Discount>
): Promise<{ message: string }> => {
  return adminApiFetch<{ message: string }>({
    requestType: 'update_discount',
    code,
    updateData,
  });
};

export const adminDeleteDiscount = async (
  code: string
): Promise<{ message: string }> => {
  return adminApiFetch<{ message: string }>({
    requestType: 'delete_discount',
    code,
  });
};

// ── Metrics ─────────────────────────────────────────────────────────

export interface AdminMetrics {
  totalOrders: number;
  totalUsers: number;
  totalRevenue: number;
  resellerCount: number;
  statusBreakdown: Record<string, number>;
}

export const adminGetMetrics = async (): Promise<AdminMetrics> => {
  return adminApiFetch<AdminMetrics>({ requestType: 'get_metrics' });
};

// ── Referrals / Affiliates ──────────────────────────────────────────

export interface ReferralGroup {
  referrer: string;
  count: number;
  referredUsers: { userId: string; username: string; joinedAt: string }[];
}

export const adminListReferrals = async (): Promise<ReferralGroup[]> => {
  return adminApiFetch<ReferralGroup[]>({ requestType: 'list_referrals' });
};

// ── Payment gateway settings ─────────────────────────────────────────

export const adminGetPaymentSettings = _adminGetPaymentSettings;
export const adminUpdatePaymentSettings = _adminUpdatePaymentSettings;
export const adminSetOrderPaymentExpiry = _adminSetOrderPaymentExpiry;

/**
 * Short-lived URL to view an object in R2 (admin only).
 * Pass `expiresInSeconds` to override the default 15-minute lifetime — used by
 * the admin export flow so embedded photo/signature links stay valid for the
 * chosen duration (1h / 12h / 24h / 7d). The server clamps to the R2 max.
 */
export const adminPresignGetUrl = async (
  objectKey: string,
  opts?: { expiresInSeconds?: number }
): Promise<string> => {
  const token = getStorageItem('idPirateAuthToken');
  if (!token) {
    throw new Error('Admin action requires authentication token.');
  }
  const payload: { key: string; expiresInSeconds?: number } = { key: objectKey };
  if (opts?.expiresInSeconds && Number.isFinite(opts.expiresInSeconds) && opts.expiresInSeconds > 0) {
    payload.expiresInSeconds = Math.floor(opts.expiresInSeconds);
  }
  const data = await apiFetch<{ url: string }>('/api/uploads/presign-get', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return data.url;
};

/**
 * User (or admin): presigned GET only if `objectKey` belongs to `orderId` for this account.
 */
export const presignGetOrderAssetUrl = async (
  orderId: string,
  objectKey: string
): Promise<string> => {
  const data = await apiFetch<{ url: string }>('/api/uploads/presign-get-own', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ orderId, key: objectKey }),
  });
  return data.url;
};


// ====================================================================
// RESELLER API FUNCTIONS
// ====================================================================

/**
 * Updates an order's status / paymentStatus via the reseller endpoint.
 * The Lambda verifies the caller owns this order.
 */
export const resellerUpdateOrder = async (
  orderId: string,
  updateData: { status?: string; paymentStatus?: string }
): Promise<{ message: string }> => {
  const token = getStorageItem('idPirateAuthToken');
  if (!token) {
    throw new Error('Reseller action requires authentication token.');
  }
  return apiFetch<{ message: string }>('/api/reseller/update-order', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ orderId, updateData }),
  });
};

export interface ResellerPublicPricing {
  defaultPerId: number;
  handlingFee: number;
  shippingFee: number;
}

/** Public — white-label portal retail pricing by reseller slug. */
export const fetchResellerPublicPricing = async (
  slug: string
): Promise<ResellerPublicPricing> => {
  const enc = encodeURIComponent(slug.trim().toLowerCase());
  return apiFetch<ResellerPublicPricing>(`/api/reseller/public-pricing?slug=${enc}`, {
    method: 'GET',
  });
};

export interface ResellerSettings {
  resellerPricing: { defaultPerId: number };
  username?: string;
}

export const fetchResellerSettings = async (): Promise<ResellerSettings> => {
  const token = getStorageItem('idPirateAuthToken');
  if (!token) throw new Error('Authentication required.');
  return apiFetch<ResellerSettings>('/api/reseller/settings', {
    method: 'GET',
    headers: authHeaders(),
  });
};

export const updateResellerSettings = async (
  resellerPricing: { defaultPerId: number }
): Promise<{ message: string; resellerPricing: { defaultPerId: number } }> => {
  const token = getStorageItem('idPirateAuthToken');
  if (!token) throw new Error('Authentication required.');
  return apiFetch('/api/reseller/settings', {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ resellerPricing }),
  });
};

export interface ResellerBatch {
  batchId: string;
  resellerId: string;
  createdAt: string;
  name: string;
  status: string;
  orderIds: string[];
  batchType?: string;
  shipTo?: string;
  settlementStatus?: string;
  orders?: unknown[];
  eligibilityErrors?: string[];
}

export const fetchResellerBatches = async (): Promise<{ batches: ResellerBatch[] }> => {
  const token = getStorageItem('idPirateAuthToken');
  if (!token) throw new Error('Authentication required.');
  return apiFetch('/api/reseller/batches', {
    method: 'GET',
    headers: authHeaders(),
  });
};

export const createResellerBatch = async (payload: {
  name?: string;
  orderIds?: string[];
}): Promise<ResellerBatch> => {
  const token = getStorageItem('idPirateAuthToken');
  if (!token) throw new Error('Authentication required.');
  return apiFetch('/api/reseller/batches', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
};

export const fetchResellerBatch = async (batchId: string): Promise<ResellerBatch> => {
  const token = getStorageItem('idPirateAuthToken');
  if (!token) throw new Error('Authentication required.');
  const enc = encodeURIComponent(batchId);
  return apiFetch(`/api/reseller/batches/${enc}`, {
    method: 'GET',
    headers: authHeaders(),
  });
};

export const updateResellerBatch = async (
  batchId: string,
  payload: {
    name?: string;
    addOrderIds?: string[];
    removeOrderIds?: string[];
  }
): Promise<ResellerBatch> => {
  const token = getStorageItem('idPirateAuthToken');
  if (!token) throw new Error('Authentication required.');
  const enc = encodeURIComponent(batchId);
  return apiFetch(`/api/reseller/batches/${enc}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ batchId, ...payload }),
  });
};

export const submitResellerBatch = async (
  batchId: string
): Promise<{ batchId: string; status: string; orderCount: number }> => {
  const token = getStorageItem('idPirateAuthToken');
  if (!token) throw new Error('Authentication required.');
  const enc = encodeURIComponent(batchId);
  return apiFetch(`/api/reseller/batches/${enc}/submit`, {
    method: 'POST',
    headers: authHeaders(),
  });
};