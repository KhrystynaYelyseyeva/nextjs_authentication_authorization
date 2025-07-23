import prisma from "./prisma";
import bcrypt from "bcryptjs";
import { User, Role } from "@prisma/client";

/**
 * Find a user by their email address
 * @param email - The email to search for
 * @returns The user or null if not found
 */
export const findUserByEmail = async (email: string) => {
  return prisma.user.findUnique({
    where: { email },
  });
};

/**
 * Find a user by their ID
 * @param id - The user ID to search for
 * @returns The user or null if not found
 */
export const findUserById = async (id: string) => {
  return prisma.user.findUnique({
    where: { id },
  });
};

/**
 * Create a new user
 * @param name - User's name
 * @param email - User's email
 * @param password - Plain text password (will be hashed)
 * @param role - Optional role (defaults to USER)
 * @returns The newly created user
 */
export const createUser = async (
  name: string,
  email: string,
  password: string,
  role: Role = "USER"
) => {
  const hashedPassword = await bcrypt.hash(password, 10);

  return prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
    },
  });
};

/**
 * Delete a user by their ID
 * @param id - The user ID to delete
 * @returns Boolean indicating success
 */
export const deleteUser = async (id: string) => {
  try {
    await prisma.user.delete({
      where: { id },
    });
    return true;
  } catch (error) {
    console.error("Error deleting user:", error);
    return false;
  }
};

/**
 * Update a user's information
 * @param id - The user ID to update
 * @param userData - The new user data (partial)
 * @returns The updated user or null if not found
 */
export const updateUser = async (
  id: string,
  userData: Partial<Omit<User, "id">>
) => {
  // If updating password, hash it
  if (userData.password) {
    userData.password = await bcrypt.hash(userData.password, 10);
  }

  try {
    return await prisma.user.update({
      where: { id },
      data: userData,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return null;
  }
};

/**
 * Get all users in the system
 * @returns Array of all users
 */
export const getAllUsers = async () => {
  return prisma.user.findMany();
};

/**
 * Seed initial users for development/testing
 * Only creates them if they don't already exist
 */
export const seedInitialUsers = async () => {
  const adminEmail = "admin@example.com";
  const userEmail = "user@example.com";

  // Check if admin user exists
  const adminExists = await findUserByEmail(adminEmail);

  if (!adminExists) {
    await createUser("Admin User", adminEmail, "password123", "ADMIN");
  }

  // Check if regular user exists
  const userExists = await findUserByEmail(userEmail);

  if (!userExists) {
    await createUser("Regular User", userEmail, "password123");
  }
};
