"use client";

import { ReactNode } from "react";
import { ApolloProvider } from "@/components/ApolloProvider";
import { ThemeRegistry } from "@/components/ThemeRegistry";
import { AuthProvider } from "@/contexts/AuthContext";

// Define the Props interface for the Providers component
interface ProvidersProps {
  children: ReactNode;
}

/**
 * Providers component that wraps our application with necessary providers:
 * - SessionProvider: Manages authentication state across the application
 * - Global providers (Auth, Apollo, Theme)
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeRegistry>
      <AuthProvider>
        <ApolloProvider>{children}</ApolloProvider>
      </AuthProvider>
    </ThemeRegistry>
  );
}
