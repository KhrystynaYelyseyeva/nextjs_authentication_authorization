import { z } from "zod";

// Basic schemas for reuse
export const emailSchema = z
  .string()
  .email("Please enter a valid email address");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    "Password must contain at least one uppercase letter, one lowercase letter, and one number"
  );

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const signupSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// Enhanced user edit schema - handles both new users and existing user edits
export const userEditSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: emailSchema,
    role: z.enum(["USER", "ADMIN"] as const),
    // Password validation changes based on context
    password: z.union([passwordSchema, z.string().length(0)]),
    confirmPassword: z.string(),
  })
  .superRefine((data, ctx) => {
    // If password is provided, validate confirm password
    if (data.password && data.password.length > 0) {
      if (data.password !== data.confirmPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Passwords do not match",
          path: ["confirmPassword"],
        });
      }
    }
  });

// Separate schema for new user creation (password required)
export const newUserSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: emailSchema,
    role: z.enum(["USER", "ADMIN"] as const),
    password: passwordSchema, // Always required for new users
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// Schema for editing existing users (password optional)
export const editUserSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: emailSchema,
    role: z.enum(["USER", "ADMIN"] as const),
    password: z.union([passwordSchema, z.string().length(0)]), // Optional
    confirmPassword: z.string(),
  })
  .refine(
    (data) => {
      // Only validate password matching if a password is provided
      if (data.password.length === 0) {
        return true;
      }
      return data.password === data.confirmPassword;
    },
    {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    }
  );
