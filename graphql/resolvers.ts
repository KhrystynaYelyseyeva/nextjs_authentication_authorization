/* eslint-disable @typescript-eslint/no-explicit-any */
import { GraphQLError } from "graphql";
import {
  hashPassword,
  comparePasswords,
  generateAccessToken,
  generateRefreshToken,
} from "@/lib/auth-utils";
import prisma from "@/lib/prisma";
import { PrismaClient } from "@prisma/client";

// Define GraphQLContext type
interface GraphQLContext {
  prisma: PrismaClient;
  userId: string | null;
  role: string | null;
}

// Create custom error classes to replace the Apollo ones
const createAuthenticationError = (message: string) =>
  new GraphQLError(message, {
    extensions: {
      code: "UNAUTHENTICATED",
      http: { status: 401 },
    },
  });

const createForbiddenError = (message: string) =>
  new GraphQLError(message, {
    extensions: {
      code: "FORBIDDEN",
      http: { status: 403 },
    },
  });

export const resolvers = {
  Query: {
    me: async (_parent: any, _args: any, context: GraphQLContext) => {
      // Check if user is authenticated
      if (!context.userId) {
        throw createAuthenticationError("Authentication required");
      }

      // Get the user from the database
      return prisma.user.findUnique({
        where: { id: context.userId },
      });
    },

    users: async (_parent: any, _args: any, context: GraphQLContext) => {
      if (!context.userId) {
        throw createAuthenticationError("Authentication required");
      }
      // Check if user is admin
      if (context.role !== "ADMIN") {
        throw createForbiddenError("Not authorized to access user list");
      }

      // Return all users
      return prisma.user.findMany();
    },

    user: async (
      _parent: any,
      args: { id: string },
      context: GraphQLContext
    ) => {
      // Check if user is authenticated
      if (!context.userId) {
        throw createAuthenticationError(
          "You must be logged in to view user details"
        );
      }

      // Allow users to view their own profile or admins to view any profile
      if (context.userId !== args.id && context.role !== "ADMIN") {
        throw createForbiddenError("Not authorized to view this user");
      }

      return prisma.user.findUnique({
        where: { id: args.id },
      });
    },
  },

  Mutation: {
    signup: async (
      _parent: any,
      args: { input: { name: string; email: string; password: string } }
    ) => {
      const { name, email, password } = args.input;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new GraphQLError("User with this email already exists", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      // Hash the password
      const hashedPassword = await hashPassword(password);

      // Create user
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: "USER", // Default role
        },
      });

      // Generate JWT tokens
      const accessToken = await generateAccessToken(user.id, user.role);
      const refreshToken = await generateRefreshToken(user.id, user.role);

      return {
        token: accessToken, // For backward compatibility
        accessToken,
        refreshToken,
        user,
      };
    },

    login: async (
      _parent: any,
      args: { input: { email: string; password: string } }
    ) => {
      const { email, password } = args.input;

      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        throw createAuthenticationError("Invalid email or password");
      }

      // Verify password
      const validPassword = await comparePasswords(password, user.password);

      if (!validPassword) {
        throw createAuthenticationError("Invalid email or password");
      }

      // Generate JWT tokens
      const accessToken = await generateAccessToken(user.id, user.role);
      const refreshToken = await generateRefreshToken(user.id, user.role);

      return {
        token: accessToken, // For backward compatibility
        accessToken,
        refreshToken,
        user,
      };
    },

    updateUser: async (
      _parent: any,
      args: {
        id: string;
        input: {
          name?: string;
          email?: string;
          password?: string;
          role?: string;
        };
      },
      context: GraphQLContext
    ) => {
      // Check if user is authenticated
      if (!context.userId) {
        throw createAuthenticationError(
          "You must be logged in to update a user"
        );
      }

      const { id, input } = args;

      // Allow users to update their own profile or admins to update any profile
      if (context.userId !== id && context.role !== "ADMIN") {
        throw createForbiddenError("Not authorized to update this user");
      }

      // Only allow admins to change roles
      if (input.role && context.role !== "ADMIN") {
        throw createForbiddenError("Only admins can change user roles");
      }

      // Prepare update data
      const updateData: any = { ...input };

      // Hash password if it's being updated
      if (updateData.password) {
        updateData.password = await hashPassword(updateData.password);
      }

      // Update user
      const updatedUser = await prisma.user.update({
        where: { id },
        data: updateData,
      });

      return updatedUser;
    },

    deleteUser: async (
      _parent: any,
      args: { id: string },
      context: GraphQLContext
    ) => {
      // Check if user is admin
      if (context.role !== "ADMIN") {
        throw createForbiddenError("Only admins can delete users");
      }

      const { id } = args;

      // Delete user
      await prisma.user.delete({
        where: { id },
      });

      return { success: true, message: "User deleted successfully" };
    },
  },
};
