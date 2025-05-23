"use client";

import { useState, useCallback, useRef } from "react";
import {
  LoginCredentials,
  SignupCredentials,
  AuthResponse,
  User,
} from "@/types/auth-types";

/**
 * Custom hook for login functionality
 */
export const useLogin = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(
    async (credentials: LoginCredentials): Promise<AuthResponse> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(credentials),
          credentials: "include", // Important for cookies
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Login failed");
        }

        return { success: true, user: data.user };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "An unexpected error occurred";
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { login, loading, error, setError };
};

/**
 * Custom hook for signup functionality
 */
export const useSignup = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signup = useCallback(
    async (credentials: SignupCredentials): Promise<AuthResponse> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/auth/signup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(credentials),
          credentials: "include", // Important for cookies
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Signup failed");
        }

        return { success: true, user: data.user };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "An unexpected error occurred";
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { signup, loading, error, setError };
};

/**
 * Custom hook for logout functionality
 */
export const useLogout = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const logout = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include", // Important for cookies
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Logout failed");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { logout, loading, error };
};

/**
 * Custom hook for getting the current user
 */
export const useCurrentUser = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add a cache mechanism to prevent excessive api calls
  const cacheTimeout = useRef<NodeJS.Timeout | null>(null);
  const cachedUser = useRef<User | null>(null);

  const getUser = useCallback(async (): Promise<User | null> => {
    // Return cached user if available
    if (cachedUser.current) {
      return cachedUser.current;
    }

    setLoading(true);
    setError(null);

    try {
      // Check if we're on login/signup page - if so, don't make the request
      if (typeof window !== "undefined") {
        const pathname = window.location.pathname;
        if (pathname === "/login" || pathname === "/signup") {
          setLoading(false);
          return null;
        }
      }

      const response = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Not authenticated
          setUser(null);
          setLoading(false);
          return null;
        }

        const data = await response.json();
        throw new Error(data.message || "Failed to get user");
      }

      const data = await response.json();

      // Cache the user for 30 seconds
      cachedUser.current = data.user;

      // Clear cache after timeout
      if (cacheTimeout.current) {
        clearTimeout(cacheTimeout.current);
      }

      cacheTimeout.current = setTimeout(() => {
        cachedUser.current = null;
      }, 1000);

      setUser(data.user);
      return data.user;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { user, setUser, loading, error, getUser };
};
