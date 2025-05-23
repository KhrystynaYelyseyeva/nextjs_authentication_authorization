import { cookies } from "next/headers";
import { verifyToken } from "./auth-utils";
import prisma from "./prisma";
import { User } from "@/types/auth-types";

/**
 * Get the current user on the server side
 */
export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;
  const refreshToken = cookieStore.get("refreshToken")?.value;

  // No tokens available
  if (!accessToken && !refreshToken) {
    return null;
  }

  try {
    // Try access token first
    let userId = "";

    if (accessToken) {
      const { userId: id } = await verifyToken(accessToken);
      userId = id;
    }

    // If access token failed, try refresh token
    if (!userId && refreshToken) {
      const { userId: id } = await verifyToken(refreshToken);
      userId = id;
    }

    if (!userId) {
      return null;
    }

    // Fetch user data from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return user;
  } catch (error) {
    console.error("Error verifying token:", error);
    return null;
  }
}

/**
 * Get the current session info
 */
export async function getSession() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  return {
    user,
    expires: new Date(Date.now() + 1000 * 60 * 60).toISOString(), // 1 hour from now
  };
}

/**
 * Check if the current user is an admin
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === "ADMIN";
}

/**
 * Get the current user's role
 */
export async function getUserRole(): Promise<string | null> {
  const user = await getCurrentUser();
  return user ? user.role : null;
}
