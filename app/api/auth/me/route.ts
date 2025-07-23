// app/api/auth/me/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken, generateAccessToken } from "@/lib/auth-utils";

export async function GET(request: NextRequest) {
  const referer = request.headers.get("referer") || "";
  if (referer.includes("/login") || referer.includes("/signup")) {
    return NextResponse.json(
      { success: false, message: "Auth check skipped on auth pages" },
      { status: 200 } // Use 200 instead of 401 to prevent redirects
    );
  }

  try {
    // Get tokens from cookies
    const accessToken = request.cookies.get("accessToken")?.value;
    const refreshToken = request.cookies.get("refreshToken")?.value;

    // If no tokens, user is not authenticated
    if (!accessToken && !refreshToken) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    let userId = "";
    let needsNewAccessToken = false;

    // Try to verify access token first
    if (accessToken) {
      try {
        const { userId: id } = await verifyToken(accessToken);
        userId = id;
      } catch {
        // Access token is invalid, try refresh token
        needsNewAccessToken = true;
      }
    }

    // If access token was invalid or not present, try refresh token
    if ((!userId || needsNewAccessToken) && refreshToken) {
      try {
        const { userId: id } = await verifyToken(refreshToken);
        userId = id;
        needsNewAccessToken = true;
      } catch {
        // Both tokens are invalid
        return NextResponse.json(
          { success: false, message: "Not authenticated" },
          { status: 401 }
        );
      }
    }

    // If we still don't have a userId, authentication failed
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    // Fetch user data from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        signature: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Create response
    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          signature: user.signature,
        },
      },
      { status: 200 }
    );

    // If we need to generate a new access token
    if (needsNewAccessToken) {
      const newAccessToken = await generateAccessToken(user.id, user.role);

      response.cookies.set({
        name: "accessToken",
        value: newAccessToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60, // 1 hour
        path: "/",
      });
    }

    return response;
  } catch (error) {
    console.error("Get current user error:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
