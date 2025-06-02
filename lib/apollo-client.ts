"use client";

import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  from,
  Observable,
} from "@apollo/client";
import { onError } from "@apollo/client/link/error";

// Add tracking for auth request frequency
let lastAuthCheck = 0;
const AUTH_CHECK_THRESHOLD = 2000; // 2 seconds
let authCheckCount = 0;
const MAX_AUTH_CHECKS = 3;

// Track if we're currently refreshing the token to prevent multiple refresh calls
let isRefreshing = false;
let pendingRequests: ((success: boolean) => void)[] = [];

// Function to process pending requests after token refresh
const processQueue = (success: boolean) => {
  pendingRequests.forEach((callback) => callback(success));
  pendingRequests = [];
};

const refreshAccessToken = async (): Promise<boolean> => {
  // Circuit breaker to prevent excessive auth requests
  const now = Date.now();
  if (now - lastAuthCheck < AUTH_CHECK_THRESHOLD) {
    authCheckCount++;

    if (authCheckCount > MAX_AUTH_CHECKS) {
      console.warn("Too many auth checks in short period - aborting refresh");
      return false;
    }
  } else {
    // Reset counter if enough time has passed
    authCheckCount = 0;
  }

  lastAuthCheck = now;

  try {
    // If already refreshing, don't make another request
    if (isRefreshing) {
      return new Promise((resolve) => {
        pendingRequests.push((success: boolean) => resolve(success));
      });
    }

    isRefreshing = true;

    const response = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include", // Important for cookies
    });

    const success = response.ok;

    isRefreshing = false;
    processQueue(success);

    if (!success) {
      throw new Error("Failed to refresh token");
    }

    return true;
  } catch (error) {
    console.error("Error refreshing token:", error);
    isRefreshing = false;
    processQueue(false);
    return false;
  }
};

// Error handling link with token refresh
const errorLink = onError(
  ({ graphQLErrors, networkError, operation, forward }) => {
    if (graphQLErrors) {
      for (const err of graphQLErrors) {
        // Check for authentication errors
        if (err.extensions?.code === "UNAUTHENTICATED") {
          // Don't refresh on login/signup pages
          if (typeof window !== "undefined") {
            const pathname = window.location.pathname;
            if (pathname === "/login" || pathname === "/signup") {
              // Just pass through the error on auth pages
              return;
            }
          }

          // Attempt to refresh the token and retry the query
          return new Observable((observer) => {
            // Attempt to refresh the token
            refreshAccessToken()
              .then((success) => {
                if (success) {
                  // Retry the failed request
                  const subscriber = {
                    next: observer.next.bind(observer),
                    error: observer.error.bind(observer),
                    complete: observer.complete.bind(observer),
                  };

                  forward(operation).subscribe(subscriber);
                } else {
                  // If refresh failed, forward the original error
                  observer.error(err);

                  // Redirect to login if needed
                  window.location.href = "/login";
                }
              })
              .catch(() => {
                // Token refresh threw an exception
                observer.error(err);

                // Redirect to login
                window.location.href = "/login";
              });
          });
        }
      }
    }

    if (networkError) {
      console.error(`[Network error]: ${networkError}`);
      // Check if it's an unauthorized error
      if (
        typeof networkError === "object" &&
        networkError !== null &&
        "statusCode" in networkError &&
        (networkError as { statusCode?: number }).statusCode === 401
      ) {
        // Try to refresh the token
        refreshAccessToken().catch(() => {
          // Redirect to login if refresh fails
          window.location.href = "/login";
        });
      }
    }
  }
);

// HTTP link
const httpLink = new HttpLink({
  uri: "/api/graphql",
  credentials: "include", // Important for cookies
});

// Create Apollo Client instance
export const createApolloClient = () => {
  return new ApolloClient({
    link: from([errorLink, httpLink]),
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: "cache-and-network",
      },
      query: {
        fetchPolicy: "network-only",
        errorPolicy: "all",
      },
      mutate: {
        errorPolicy: "all",
      },
    },
  });
};
