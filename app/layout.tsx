import { Providers } from "./providers";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Box } from "@mui/material";
import { Header } from "@/components/layout/Header";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    template: "%s | Next.js GraphQL Auth",
    default: "Next.js GraphQL Auth",
  },
  description:
    "A complete authentication and authorization system with Next.js, PostgreSQL, and GraphQL",
  keywords: [
    "Next.js",
    "React",
    "TypeScript",
    "Authentication",
    "Authorization",
    "Auth.js",
    "GraphQL",
    "PostgreSQL",
  ],
  authors: [{ name: "Khrystyna Yelyseieva" }],
  creator: "Khrystyna Yelyseieva",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#1976d2",
};

/**
 * Root layout component that wraps all pages in the application
 * Includes:
 * - Global providers (Auth, Theme)
 * - Common layout elements (Header)
 * - Global styling
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body suppressHydrationWarning>
        <Providers>
          <Box
            component="div"
            sx={{
              display: "flex",
              flexDirection: "column",
              minHeight: "100vh",
              bgcolor: "background.default",
            }}
          >
            <Header />

            <Box
              component="main"
              sx={{
                flex: 1,
                py: 4,
                display: "flex",
                flexDirection: "column",
              }}
            >
              {children}
            </Box>
          </Box>
        </Providers>
      </body>
    </html>
  );
}
