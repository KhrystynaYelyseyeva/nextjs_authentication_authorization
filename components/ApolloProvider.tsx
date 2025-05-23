"use client";

import { ApolloProvider as Provider } from "@apollo/client";
import { ReactNode, useState, useEffect } from "react";
import { createApolloClient } from "@/lib/apollo-client";
import { AuthStateManager } from "./auth/AuthStateManager";

export function ApolloProvider({ children }: { children: ReactNode }) {
  const [client, setClient] = useState<ReturnType<
    typeof createApolloClient
  > | null>(null);

  useEffect(() => {
    // Initialize Apollo Client on the client side
    setClient(createApolloClient());
  }, []);

  // Wait for client-side initialization
  if (!client) {
    return null;
  }

  return (
    <Provider client={client}>
      <AuthStateManager>{children}</AuthStateManager>
    </Provider>
  );
}
