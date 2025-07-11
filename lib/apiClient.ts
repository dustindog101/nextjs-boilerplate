// --- START OF FILE lib/apiClient.ts (Complete and Updated) ---

// --- Type Definitions for API Payloads and Responses ---

// Auth Payloads
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

// Auth Responses
interface LoginResponse {
  message: string;
  token: string;
}

interface RegisterResponse {
  message: string;
}

// Generic Error Response
interface ErrorResponse {
  error: string;
}

// User Data Structure (for Admin panel)
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


// --- Retrieve Base URLs from Environment Variables ---
const AUTH_LAMBDA_URL = process.env.NEXT_PUBLIC_AUTH_LAMBDA_URL;
const LOOKUP_LAMBDA_URL = process.env.NEXT_PUBLIC_LOOKUP_LAMBDA_URL;
const ADMIN_LAMBDA_URL = process.env.NEXT_PUBLIC_ADMIN_LAMBDA_URL;


/**
 * A generic fetch wrapper to handle common logic like JSON parsing and error handling.
 * This is the base function used by all other API calls.
 */
async function apiFetch<T>(url: string, options: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok) {
    // If the server returns an error, throw it so it can be caught in a try/catch block.
    throw new Error((data as ErrorResponse).error || 'An unknown API error occurred.');
  }
  return data as T;
}


// ====================================================================
// PUBLIC & USER-FACING API FUNCTIONS
// ====================================================================

/**
 * Handles user registration.
 */
export const registerUser = async (payload: Omit<RegisterPayload, 'requestType'>): Promise<RegisterResponse> => {
  if (!AUTH_LAMBDA_URL) {
    console.error("Vercel Environment Variable NEXT_PUBLIC_AUTH_LAMBDA_URL is not configured.");
    throw new Error("Authentication service is not available.");
  }
  const fullPayload: RegisterPayload = { ...payload, requestType: 'register' };
  return apiFetch<RegisterResponse>(AUTH_LAMBDA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fullPayload),
    mode: 'cors',
  });
};

/**
 * Handles user login.
 */
export const loginUser = async (payload: Omit<LoginPayload, 'requestType'>): Promise<LoginResponse> => {
  if (!AUTH_LAMBDA_URL) {
    console.error("Vercel Environment Variable NEXT_PUBLIC_AUTH_LAMBDA_URL is not configured.");
    throw new Error("Authentication service is not available.");
  }
  const fullPayload: LoginPayload = { ...payload, requestType: 'login' };
  return apiFetch<LoginResponse>(AUTH_LAMBDA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fullPayload),
    mode: 'cors',
  });
};

/**
 * Fetches all orders for the currently authenticated user. (Protected)
 */
export const fetchUserOrders = async (): Promise<{ orders: any[] }> => {
    if (!LOOKUP_LAMBDA_URL) {
      console.error("Vercel Environment Variable NEXT_PUBLIC_LOOKUP_LAMBDA_URL is not configured.");
      throw new Error("Order lookup service is not available.");
    }
    const token = localStorage.getItem('idPirateAuthToken');
    if (!token) {
      throw new Error("No authentication token found for protected route.");
    }
    const payload = { requestType: "list_user_orders" };
    return apiFetch<{ orders: any[] }>(LOOKUP_LAMBDA_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
        mode: 'cors'
    });
};


// ====================================================================
// ADMIN-ONLY API FUNCTIONS
// ====================================================================

/**
 * A generic fetch wrapper for admin requests that automatically includes the auth token.
 */
async function adminApiFetch<T>(payload: object): Promise<T> {
  if (!ADMIN_LAMBDA_URL) {
    console.error("Vercel Environment Variable NEXT_PUBLIC_ADMIN_LAMBDA_URL is not configured.");
    throw new Error("Admin service is not available.");
  }
  
  const token = localStorage.getItem('idPirateAuthToken');
  if (!token) {
    throw new Error("Admin action requires authentication token.");
  }

  // The apiFetch function is reused here.
  return apiFetch<T>(ADMIN_LAMBDA_URL, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
}

/**
 * Fetches a list of all users from the admin endpoint.
 */
export const listAllUsers = async (): Promise<User[]> => {
  // The admin lambda for 'list_all_users' returns the array directly.
  return adminApiFetch<User[]>({ requestType: 'list_all_users' });
};

/**
 * Updates a user's data via the admin endpoint.
 * @param userId The ID of the user to update.
 * @param updateData An object containing the fields to change (e.g., { role: 'admin' }).
 */
export const adminUpdateUser = async (userId: string, updateData: Partial<User>): Promise<{ message: string }> => {
  const payload = {
    requestType: 'admin_update_user',
    userId: userId,
    updateData: updateData
  };
  return adminApiFetch<{ message:string }>(payload);
};


// --- END OF FILE lib/apiClient.ts (Complete and Updated) ---