"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback, ChangeEvent, FormEvent } from "react";
import { z } from "zod";
import { useFormValidation } from "@/hooks/useFormValidation";

export type FormErrors<T> = Partial<Record<keyof T, string>>;

export function useForm<T extends Record<string, unknown>>(
  initialValues: T,
  schema: z.ZodType<any, any, any>,
  onSubmit: (values: T) => void | Promise<void>
) {
  // Form state
  const [values, setValues] = useState<T>(initialValues);
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use the validation hook for all validation logic
  const {
    errors,
    validateForm: validateFormSchema,
    validateField: validateFieldSchema,
    clearErrors,
    clearError,
  } = useFormValidation<T>(schema as z.ZodObject<z.ZodRawShape>);

  // Update form field value
  const handleChange = useCallback(
    (
      e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
      const { name, value, type } = e.target;

      // Update value with proper type conversion
      const typedValue =
        type === "number" ? (value === "" ? "" : Number(value)) : value;

      setValues((prev) => ({
        ...prev,
        [name]: typedValue,
      }));

      // Mark field as touched
      setTouched((prev) => ({
        ...prev,
        [name]: true,
      }));

      // Validate field using the validation hook
      validateFieldSchema(name as keyof T, typedValue);
    },
    [validateFieldSchema]
  );

  // Set form field value programmatically
  const setFieldValue = useCallback(
    (name: keyof T, value: unknown) => {
      setValues((prev) => ({
        ...prev,
        [name]: value,
      }));

      // Validate field using the validation hook
      validateFieldSchema(name, value);
    },
    [validateFieldSchema]
  );

  // Set field as touched
  const setFieldTouched = useCallback(
    (name: keyof T, isTouched: boolean = true) => {
      setTouched((prev) => ({
        ...prev,
        [name]: isTouched,
      }));

      // Validate field if marked as touched
      if (isTouched) {
        validateFieldSchema(name, values[name]);
      }
    },
    [values, validateFieldSchema]
  );

  // Validate entire form
  const validateForm = useCallback(() => {
    // Use the validation hook's validateForm method
    return validateFormSchema(values);
  }, [validateFormSchema, values]);

  // Handle form submission
  const handleSubmit = useCallback(
    async (e?: FormEvent) => {
      if (e) {
        e.preventDefault();
      }

      // Mark all fields as touched
      const allTouched = Object.keys(values).reduce(
        (acc, key) => ({
          ...acc,
          [key]: true,
        }),
        {} as Record<keyof T, boolean>
      );

      setTouched(allTouched);

      // Validate form
      const isValid = validateForm();

      if (!isValid) {
        return;
      }

      try {
        setIsSubmitting(true);
        await onSubmit(values);
      } finally {
        setIsSubmitting(false);
      }
    },
    [onSubmit, validateForm, values]
  );

  // Reset form
  const resetForm = useCallback(() => {
    setValues(initialValues);
    clearErrors();
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues, clearErrors]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleSubmit,
    setFieldValue,
    setFieldTouched,
    validateField: validateFieldSchema,
    validateForm,
    resetForm,
    clearErrors,
    clearError,
  };
}
