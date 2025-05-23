"use client";

import {
  useQuery,
  useMutation,
  DocumentNode,
  OperationVariables,
} from "@apollo/client";
import { useCallback, useState } from "react";

/**
 * Enhanced hook for Apollo queries with better error handling and loading states
 */
export function useEnhancedQuery<
  TData = unknown,
  TVariables extends OperationVariables = OperationVariables
>(
  query: DocumentNode,
  options: {
    variables?: TVariables;
    skip?: boolean;
    fetchPolicy?:
      | "cache-first"
      | "network-only"
      | "cache-and-network"
      | "no-cache"
      | "standby";
    errorMessage?: string;
  } = {}
) {
  const [error, setError] = useState<string | null>(null);

  const result = useQuery<TData, TVariables>(query, {
    ...options,
    onError: (error) => {
      console.error("Query error:", error);
      setError(options.errorMessage || error.message);
    },
  });

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    ...result,
    error,
    clearError,
  };
}

/**
 * Enhanced hook for Apollo mutations with better error handling and loading states
 */
export function useEnhancedMutation<
  TData = unknown,
  TVariables extends OperationVariables = OperationVariables
>(
  mutation: DocumentNode,
  options: {
    onCompleted?: (data: TData) => void;
    onError?: (error: Error) => void;
    errorMessage?: string;
  } = {}
) {
  const [error, setError] = useState<string | null>(null);

  const [mutateFunction, result] = useMutation<TData, TVariables>(mutation, {
    onError: (error) => {
      console.error("Mutation error:", error);
      setError(options.errorMessage || error.message);
      if (options.onError) {
        options.onError(error);
      }
    },
    onCompleted: options.onCompleted,
  });

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Enhanced mutation function with try/catch
  const enhancedMutate = useCallback(
    async (variables: TVariables) => {
      try {
        clearError();
        return await mutateFunction({ variables });
      } catch {
        // Apollo already handles the error through the onError callback
        // This catch is just to prevent unhandled promise rejections
        return { data: null };
      }
    },
    [mutateFunction, clearError]
  );

  return {
    mutate: enhancedMutate,
    ...result,
    error,
    clearError,
  };
}

/**
 * Custom hook for pagination logic
 */
export function usePagination<T>(items: T[], itemsPerPage = 10) {
  const [currentPage, setCurrentPage] = useState(1);

  // Calculate total pages
  const totalPages = Math.ceil(items.length / itemsPerPage);

  // Get current items
  const currentItems = items.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Change page
  const paginate = (pageNumber: number) => {
    setCurrentPage(Math.max(1, Math.min(pageNumber, totalPages)));
  };

  return {
    currentPage,
    totalPages,
    currentItems,
    paginate,
  };
}
