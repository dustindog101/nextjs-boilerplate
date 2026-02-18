// --- app/contexts/AuthContext.tsx ---

"use client";
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { getStorageItem, setStorageItem, removeStorageItem } from '../../lib/storage';
import type { JwtPayload } from '../../lib/types';

// Re-export so existing consumers don't break
export type { JwtPayload };

// --- Type for the Context ---
interface AuthContextType {
  user: JwtPayload | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
}

// --- Utility function to decode JWT ---
const decodeJwt = (token: string): JwtPayload | null => {
  try {
    const payloadBase64 = token.split('.')[1];
    const decodedJson = atob(payloadBase64);
    return JSON.parse(decodedJson);
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
};

// --- Create the Context ---
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- Create the Provider Component ---
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<JwtPayload | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // This runs only in the browser after mount
    const storedToken = getStorageItem('idPirateAuthToken');
    if (storedToken) {
      const decodedUser = decodeJwt(storedToken);
      if (decodedUser && decodedUser.exp * 1000 > Date.now()) {
        setUser(decodedUser);
        setToken(storedToken);
      } else {
        removeStorageItem('idPirateAuthToken');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (newToken: string) => {
    const decodedUser = decodeJwt(newToken);
    if (decodedUser) {
      setStorageItem('idPirateAuthToken', newToken);
      setUser(decodedUser);
      setToken(newToken);
    } else {
      console.error("Attempted to login with an invalid token.");
    }
  };

  const logout = () => {
    removeStorageItem('idPirateAuthToken');
    setUser(null);
    setToken(null);
    if (typeof window !== 'undefined') {
      window.location.href = '/account';
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// --- END OF FILE app/contexts/AuthContext.tsx ---