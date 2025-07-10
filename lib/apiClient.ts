// --- START OF FILE lib/apiClient.ts ---

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

// --- Retrieve Base URL from Environment Variables ---
const AUTH_LAMBDA_URL = process.env.NEXT_PUBLIC_AUTH_LAMBDA_URL;

/**
 * A generic fetch wrapper to handle common logic like JSON parsing and error handling.
 * @param url The endpoint URL.
 * @param options The fetch options (method, headers, body).
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

/**
 * Handles user registration.
 * @param payload - The registration data.
 * @returns The success message from the backend.
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
 * @param payload - The login credentials.
 * @returns The login response containing the JWT.
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

// You can add more functions here for other protected API calls. For example:
/*
export const fetchUserOrders = async () => {
    const LOOKUP_LAMBDA_URL = process.env.NEXT_PUBLIC_LOOKUP_LAMBDA_URL;
    if (!LOOKUP_LAMBDA_URL) throw new Error("Lookup service URL is not configured.");

    const token = localStorage.getItem('idPirateAuthToken');
    if (!token) throw new Error("No authentication token found for protected route.");

    const payload = { requestType: "list_user_orders" };

    return apiFetch(LOOKUP_LAMBDA_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` // Automatically attach the token
        },
        body: JSON.stringify(payload),
        mode: 'cors'
    });
};
*/

// --- END OF FILE lib/apiClient.ts ---