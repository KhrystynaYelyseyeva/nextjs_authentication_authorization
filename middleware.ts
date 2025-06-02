import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { generateAccessToken, verifyToken } from "./lib/auth-utils";

const PUBLIC_ROUTES = ["/", "/login", "/signup", "/register"];
const AUTH_API_ROUTES = [
  "/api/auth/login",
  "/api/auth/signup",
  "/api/auth/refresh",
];
const ADMIN_ROUTES = ["/admin"];

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => route === path || path.startsWith(`${route}/`)
  );

  const isAuthApiRoute = AUTH_API_ROUTES.some(
    (route) => route === path || path.startsWith(`${route}/`)
  );

  // Allow public routes (including auth API routes)
  if (isPublicRoute || isAuthApiRoute) {
    return NextResponse.next();
  }

  const isAdminRoute = ADMIN_ROUTES.some(
    (route) => path === route || path.startsWith(`${route}/`)
  );

  // At this point, authentication is required
  const accessToken = req.cookies.get("accessToken")?.value;
  const refreshToken = req.cookies.get("refreshToken")?.value;

  if (!accessToken && !refreshToken) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    let userId = "";
    let role = "";
    let needsNewAccessToken = false;

    // Try to verify access token
    if (accessToken) {
      try {
        const payload = await verifyToken(accessToken);
        userId = payload.userId;
        role = payload.role;
      } catch {
        // Access token is invalid or expired
        // We'll try the refresh token next
        needsNewAccessToken = true;
      }
    }

    // If access token was invalid or not present, try refresh token
    if ((!userId || needsNewAccessToken) && refreshToken) {
      try {
        const payload = await verifyToken(refreshToken);
        userId = payload.userId;
        role = payload.role;
        needsNewAccessToken = true; // We'll need to generate a new access token
      } catch {
        // Refresh token is also invalid
        const response = NextResponse.redirect(new URL("/login", req.url));
        response.cookies.delete("accessToken");
        response.cookies.delete("refreshToken");
        return response;
      }
    }

    // If still no valid user, redirect to login
    if (!userId) {
      const response = NextResponse.redirect(new URL("/login", req.url));
      response.cookies.delete("accessToken");
      response.cookies.delete("refreshToken");
      return response;
    }

    // Check admin access
    if (isAdminRoute && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Create the response
    const response = NextResponse.next();

    // If we need to generate a new access token
    if (needsNewAccessToken) {
      const newAccessToken = await generateAccessToken(userId, role);

      // Set the new access token cookie
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
    // Any unhandled errors, clear cookies and redirect to login
    console.error("Authentication middleware error:", error);
    const response = NextResponse.redirect(new URL("/login", req.url));
    response.cookies.delete("accessToken");
    response.cookies.delete("refreshToken");
    return response;
  }
}

// Only apply middleware to routes that need protection
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/profile/:path*",
    "/settings/:path*",
  ],
};
