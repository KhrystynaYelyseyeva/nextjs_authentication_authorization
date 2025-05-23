// This file is used to define environment variables and their validation
// It provides type safety and validation for environment variables

import { z } from "zod";

// Define schema for environment variables
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),

  // Authentication
  JWT_SECRET: z.string().min(32), // Require at least 32 characters for security
  ACCESS_TOKEN_EXPIRY: z.string().default("1h"),
  REFRESH_TOKEN_EXPIRY: z.string().default("7d"),

  // Server
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().default(3000),
  NEXTAUTH_URL: z.string().url().optional(),
  NEXTAUTH_SECRET: z.string().optional(),

  // API URLs
  API_URL: z.string().url().default("http://localhost:3000/api"),
});

// Process environment variables
const processEnv = {
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  ACCESS_TOKEN_EXPIRY: process.env.ACCESS_TOKEN_EXPIRY || "1h",
  REFRESH_TOKEN_EXPIRY: process.env.REFRESH_TOKEN_EXPIRY || "7d",
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT || "3000",
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  API_URL: process.env.API_URL || "http://localhost:3000/api",
};

// Parse and validate environment variables
const env = envSchema.safeParse(processEnv);

if (!env.success) {
  console.error(
    "❌ Invalid environment variables:",
    JSON.stringify(env.error.format(), null, 4)
  );
  throw new Error("Invalid environment variables");
}

// Export validated environment variables
export const config = env.data;

// Type-safe environment accessor
export function getEnv(key: keyof typeof config) {
  return config[key];
}
