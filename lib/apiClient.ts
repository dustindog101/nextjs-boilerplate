// --- START OF FILE lib/apiClient.ts (Updated) ---

// --- Type Definitions for API Payloads and Responses ---
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

// --- Retrieve Base URLs from Environment Variables ---
const AUTH_LAMBDA_URL = process.env.NEXT_PUBLIC_AUTH_LAMBDA_URL;
const LOOKUP_LAMBDA_URL = process.env.NEXT_PUBLIC_LOOKUP_LAMBDA_URL; // Add this

/**
 * A generic fetch wrapper to handle common logic like JSON parsing and error handling.
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
 * Fetches all orders for the currently authenticated user.
 * This is a protected endpoint and will automatically include the auth token.
 */
export const fetchUserOrders = async () => {
    if (!LOOKUP_LAMBDA_URL) {
      console.error("Vercel Environment Variable NEXT_PUBLIC_LOOKUP_LAMBDA_URL is not configured.");
      throw new Error("Order lookup service is not available.");
    }

    const token = localStorage.getItem('idPirateAuthToken');
    if (!token) {
      // This case should ideally be handled by the withAuth HOC, but it's a good safeguard.
      throw new Error("No authentication token found for protected route.");
    }

    const payload = { requestType: "list_user_orders" };

    return apiFetch<any>(LOOKUP_LAMBDA_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` // Automatically attach the token
        },
        body: JSON.stringify(payload),
        mode: 'cors'
    });
};


// --- END OF FILE lib/apiClient.ts (Updated) ---