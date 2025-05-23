"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export function AuthStateManager({ children }: { children: React.ReactNode }) {
  const { user, refreshUser } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();

  // Check auth state on initial load
  useEffect(() => {
    const checkAuthState = async () => {
      if (!user && !isRefreshing) {
        setIsRefreshing(true);

        try {
          // Try to refresh user data
          await refreshUser();
        } catch (error) {
          console.error("Auth check failed:", error);
        } finally {
          setIsRefreshing(false);
        }
      }
    };

    checkAuthState();
  }, [user, refreshUser, isRefreshing]);

  // Listen for auth errors in GraphQL responses
  useEffect(() => {
    const handleStorageEvent = (event: StorageEvent) => {
      if (event.key === "auth-error" && event.newValue === "true") {
        // Clear the flag
        localStorage.setItem("auth-error", "false");

        // Redirect to login
        router.push("/login");
      }
    };

    window.addEventListener("storage", handleStorageEvent);

    return () => {
      window.removeEventListener("storage", handleStorageEvent);
    };
  }, [router]);

  return children;
}
