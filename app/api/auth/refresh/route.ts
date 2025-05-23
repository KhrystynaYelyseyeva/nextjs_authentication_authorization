import { NextRequest, NextResponse } from "next/server";
import { verifyToken, generateAccessToken } from "@/lib/auth-utils";

export async function POST(request: NextRequest) {
  try {
    // Get refresh token from cookies
    const refreshToken = request.cookies.get("refreshToken")?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, message: "No refresh token provided" },
        { status: 401 }
      );
    }

    try {
      const payload = await verifyToken(refreshToken);

      if (!payload.userId) {
        throw new Error("Invalid refresh token");
      }

      // Generate new access token
      const newAccessToken = await generateAccessToken(
        payload.userId,
        payload.role
      );

      // Create response
      const response = NextResponse.json(
        { success: true, message: "Token refreshed successfully" },
        { status: 200 }
      );

      // Set new access token cookie
      response.cookies.set({
        name: "accessToken",
        value: newAccessToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60, // 1 hour
        path: "/",
      });

      return response;
    } catch {
      // Invalid or expired refresh token
      const response = NextResponse.json(
        { success: false, message: "Invalid refresh token" },
        { status: 401 }
      );

      // Clear cookies
      response.cookies.delete("accessToken");
      response.cookies.delete("refreshToken");

      return response;
    }
  } catch (error) {
    console.error("Token refresh error:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
