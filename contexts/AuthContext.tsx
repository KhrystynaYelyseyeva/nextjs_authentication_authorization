"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useRouter } from "next/navigation";
import {
  AuthContextType,
  AuthState,
  User,
  LoginCredentials,
  SignupCredentials,
  AuthResponse,
} from "@/types/auth-types";
import {
  useLogin,
  useSignup,
  useLogout,
  useCurrentUser,
} from "@/hooks/auth-hooks";

const UserRole = { USER: "USER", ADMIN: "ADMIN" };

// Initial state
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isAdmin: false,
  loading: true,
  error: null,
};

// Define action types
type AuthAction =
  | { type: "AUTH_START" }
  | { type: "AUTH_SUCCESS"; payload: User }
  | { type: "AUTH_ERROR"; payload: string }
  | { type: "AUTH_LOGOUT" }
  | { type: "CLEAR_ERROR" };

// Reducer to handle authentication state
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case "AUTH_START":
      return {
        ...state,
        loading: true,
        error: null,
      };
    case "AUTH_SUCCESS":
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isAdmin: action.payload.role === UserRole.ADMIN,
        loading: false,
        error: null,
      };
    case "AUTH_ERROR":
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    case "AUTH_LOGOUT":
      return {
        ...initialState,
        loading: false,
      };
    case "CLEAR_ERROR":
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const { login: loginApi } = useLogin();
  const { signup: signupApi } = useSignup();
  const { logout: logoutApi } = useLogout();
  const { getUser } = useCurrentUser();
  const router = useRouter();

  // Add a flag to track initialization
  const initRef = useRef(false);

  // Initialize auth state - check if user is logged in
  useEffect(() => {
    // Only attempt to initialize once
    if (initRef.current) return;
    initRef.current = true;

    const initAuth = async () => {
      try {
        dispatch({ type: "AUTH_START" });
        // Get the current route
        const pathname = window.location.pathname;

        // Skip auth check on login/signup pages to break the loop
        if (pathname === "/login" || pathname === "/signup") {
          dispatch({ type: "AUTH_LOGOUT" });
          return;
        }

        const user = await getUser();

        if (user) {
          dispatch({ type: "AUTH_SUCCESS", payload: user });
        } else {
          dispatch({ type: "AUTH_LOGOUT" });

          // Only redirect if not already on login or signup
          if (pathname !== "/login" && pathname !== "/signup") {
            router.push("/login");
          }
        }
      } catch (error) {
        dispatch({
          type: "AUTH_ERROR",
          payload:
            error instanceof Error ? error.message : "Authentication failed",
        });
      }
    };

    initAuth();
  }, [getUser, router]);

  // Login handler
  const login = useCallback(
    async (credentials: LoginCredentials): Promise<AuthResponse> => {
      dispatch({ type: "AUTH_START" });

      try {
        const result = await loginApi(credentials);

        if (result.success && result.user) {
          dispatch({ type: "AUTH_SUCCESS", payload: result.user });
          return { success: true, user: result.user };
        } else {
          dispatch({
            type: "AUTH_ERROR",
            payload: result.error || "Login failed",
          });
          return { success: false, error: result.error || "Login failed" };
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Login failed";
        dispatch({ type: "AUTH_ERROR", payload: errorMessage });
        return { success: false, error: errorMessage };
      }
    },
    [loginApi]
  );

  // Signup handler
  const signup = useCallback(
    async (credentials: SignupCredentials): Promise<AuthResponse> => {
      dispatch({ type: "AUTH_START" });

      try {
        const result = await signupApi(credentials);

        if (result.success && result.user) {
          dispatch({ type: "AUTH_SUCCESS", payload: result.user });
          return { success: true, user: result.user };
        } else {
          dispatch({
            type: "AUTH_ERROR",
            payload: result.error || "Signup failed",
          });
          return { success: false, error: result.error || "Signup failed" };
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Signup failed";
        dispatch({ type: "AUTH_ERROR", payload: errorMessage });
        return { success: false, error: errorMessage };
      }
    },
    [signupApi]
  );

  // Logout handler
  const logout = useCallback(async (): Promise<void> => {
    try {
      await logoutApi();
      dispatch({ type: "AUTH_LOGOUT" });
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      // Still clear the state even if the API call fails
      dispatch({ type: "AUTH_LOGOUT" });
      router.push("/login");
    }
  }, [logoutApi, router]);

  // Clear error state
  const clearError = useCallback(() => {
    dispatch({ type: "CLEAR_ERROR" });
  }, []);

  // Refresh user data
  const refreshUser = useCallback(async () => {
    try {
      dispatch({ type: "AUTH_START" });
      const user = await getUser();

      if (user) {
        dispatch({ type: "AUTH_SUCCESS", payload: user });
      } else {
        dispatch({ type: "AUTH_LOGOUT" });
      }
    } catch (error) {
      dispatch({
        type: "AUTH_ERROR",
        payload:
          error instanceof Error ? error.message : "Failed to refresh user",
      });
    }
  }, [getUser]);

  const value: AuthContextType = {
    ...state,
    login,
    signup,
    logout,
    clearError,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};
