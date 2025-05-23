"use client";
import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteLayoutProps {
  children: ReactNode;
  requireAdmin?: boolean;
  fallbackUrl?: string;
}

/**
 * A reusable layout component for protected routes
 * Handles authentication checks and redirects
 * Centralizes authorization logic in one place
 */
export default function ProtectedRouteLayout({
  children,
  requireAdmin = false,
  fallbackUrl = "/login",
}: ProtectedRouteLayoutProps) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const router = useRouter();

  // Redirect logic
  useEffect(() => {
    // Wait until auth state is determined
    if (!loading) {
      // Redirect if not authenticated
      if (!isAuthenticated) {
        // Preserve the current URL to redirect back after login
        const currentPath = window.location.pathname;
        router.push(
          `${fallbackUrl}?returnTo=${encodeURIComponent(currentPath)}`
        );
      }
      // Redirect if admin access required but user is not admin
      else if (requireAdmin && !isAdmin) {
        router.push("/dashboard");
      }
    }
  }, [isAuthenticated, isAdmin, loading, requireAdmin, router, fallbackUrl]);

  // Show loading state
  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "50vh",
        }}
      >
        <CircularProgress size={40} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Checking authentication...
        </Typography>
      </Box>
    );
  }

  // Check access requirements
  const hasAccess = isAuthenticated && (!requireAdmin || isAdmin);

  // Show children only if user has access
  return hasAccess ? <>{children}</> : null;
}
