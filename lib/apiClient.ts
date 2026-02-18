// --- lib/apiClient.ts ---
// Centralized API client. All calls go through Next.js Route Handlers
// (app/api/*) which proxy to Lambda functions server-side.
// Lambda URLs are NEVER exposed to the browser.

import { getStorageItem } from './storage';

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
    throw new Error((data as ErrorResponse).error || 'An unknown API error occurred.');
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
    body: JSON.stringify({ orderId }),
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
  updateData: Partial<User>
): Promise<{ message: string }> => {
  return adminApiFetch<{ message: string }>({
    requestType: 'admin_update_user',
    userId,
    updateData,
  });
};