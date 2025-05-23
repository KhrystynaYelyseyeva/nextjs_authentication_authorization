"use client";

import { useState, useCallback } from "react";
import { z } from "zod";

export type ValidationError = {
  [key: string]: string;
};

// Use a more specific type for the schema parameter
export function useFormValidation<T extends Record<string, unknown>>(
  schema: z.ZodObject<z.ZodRawShape>
) {
  const [errors, setErrors] = useState<ValidationError>({});

  // Validate entire form
  const validateForm = useCallback(
    (data: T): boolean => {
      const result = schema.safeParse(data);

      if (!result.success) {
        const formattedErrors: ValidationError = {};

        result.error.errors.forEach((error) => {
          const path = error.path.join(".");
          formattedErrors[path] = error.message;
        });

        setErrors(formattedErrors);
        return false;
      }

      // Clear errors on success
      setErrors({});
      return true;
    },
    [schema]
  );

  // Validate a single field
  const validateField = useCallback(
    (name: keyof T, value: unknown): boolean => {
      try {
        // Now we can safely access schema.shape without type errors
        if (!(name in schema.shape)) {
          console.warn(
            `Field "${String(name)}" not found in the validation schema`
          );
          return true;
        }

        const fieldSchema = z.object({
          [name as string]: schema.shape[name as string],
        });

        // Validate just this field
        fieldSchema.parse({ [name]: value });

        // Clear error for this field if validation passes
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[name as string];
          return newErrors;
        });

        return true;
      } catch (error) {
        if (error instanceof z.ZodError) {
          // Set error for this field
          const fieldError = error.errors.find((err) => err.path[0] === name);

          if (fieldError) {
            setErrors((prev) => ({
              ...prev,
              [name as string]: fieldError.message,
            }));
          }
        }

        return false;
      }
    },
    [schema]
  );

  // Clear all errors
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  // Clear error for a specific field
  const clearError = useCallback((name: keyof T) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[name as string];
      return newErrors;
    });
  }, []);

  return {
    errors,
    validateForm,
    validateField,
    clearErrors,
    clearError,
  };
}
