// --- START OF FILE app/contexts/AuthContext.tsx ---

"use client";
import React, { createContext, useState, useEffect, ReactNode } from 'react';

// --- Interface for JWT Payload ---
// Ensure this matches the payload structure from your auth_handler.py
export interface JwtPayload {
  userId: string;
  username: string;
  role: 'user' | 'admin';
  isReseller: boolean;
  exp: number; // Expiration timestamp in seconds
}

// --- Type for the Context ---
interface AuthContextType {
  user: JwtPayload | null;
  token: string | null;
  isLoading: boolean; // Tracks the initial authentication check
  login: (token: string) => void;
  logout: () => void;
}

// --- Utility function to decode JWT ---
// A simple, client-side-only decoder for reading the payload.
const decodeJwt = (token: string): JwtPayload | null => {
  try {
    const payloadBase64 = token.split('.')[1];
    const decodedJson = atob(payloadBase64);
    const decoded = JSON.parse(decodedJson);
    return decoded;
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
};

// --- Create the Context ---
// The context will be undefined by default, so we check for it in the useAuth hook.
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- Create the Provider Component ---
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<JwtPayload | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start as true to check auth on mount

  useEffect(() => {
    // This effect runs once when the app loads to check for an existing session.
    try {
      const storedToken = localStorage.getItem('idPirateAuthToken');
      if (storedToken) {
        const decodedUser = decodeJwt(storedToken);
        // Check if the token is expired
        if (decodedUser && decodedUser.exp * 1000 > Date.now()) {
          setUser(decodedUser);
          setToken(storedToken);
        } else {
          // Token is expired or invalid, clear it
          localStorage.removeItem('idPirateAuthToken');
        }
      }
    } catch (error) {
      console.error("Failed to process stored token:", error);
      // Clear any potentially corrupt token
      localStorage.removeItem('idPirateAuthToken');
    } finally {
      setIsLoading(false); // Finished initial check
    }
  }, []); // Empty dependency array means this runs only once on mount

  const login = (newToken: string) => {
    const decodedUser = decodeJwt(newToken);
    if (decodedUser) {
      localStorage.setItem('idPirateAuthToken', newToken);
      setUser(decodedUser);
      setToken(newToken);
    } else {
      console.error("Attempted to login with an invalid token.");
    }
  };

  const logout = () => {
    localStorage.removeItem('idPirateAuthToken');
    setUser(null);
    setToken(null);
    // Redirect to login page after logout to ensure a clean state
    window.location.href = '/account';
  };

  const value = {
    user,
    token,
    isLoading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// --- END OF FILE app/contexts/AuthContext.tsx ---